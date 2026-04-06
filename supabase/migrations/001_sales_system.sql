-- CHMetrics Admin — Sales System Migration
-- Ausführen im Supabase SQL Editor
-- Stand: April 2026

-- 1. leads Tabelle erweitern
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'DE' CHECK (country IN ('DE', 'AT', 'CH')),
  ADD COLUMN IF NOT EXISTS campaign_id UUID,
  ADD COLUMN IF NOT EXISTS call_status TEXT DEFAULT 'pending'
    CHECK (call_status IN ('pending','calling','reached','not_reached','interested','not_interested','callback','converted','lost'));

-- Status-Werte erweitern (bestehende Spalte belassen, call_status neu)
-- Bestehende status-Spalte bleibt für Email-Status

-- 2. Kampagnen-Tabelle
CREATE TABLE IF NOT EXISTS sales_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  budget_eur NUMERIC(10,2) NOT NULL DEFAULT 0,
  spent_eur NUMERIC(10,2) NOT NULL DEFAULT 0,
  target_segment TEXT NOT NULL DEFAULT '200-500'
    CHECK (target_segment IN ('50-200','200-500','alle')),
  target_country TEXT DEFAULT 'alle'
    CHECK (target_country IN ('DE','AT','CH','alle')),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','paused','completed')),
  start_date DATE,
  end_date DATE,
  calls_per_day INT DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Anruf-Logs von Bland.ai
CREATE TABLE IF NOT EXISTS sales_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES sales_campaigns(id) ON DELETE SET NULL,
  bland_call_id TEXT,                    -- Bland.ai Call ID für Webhook
  called_at TIMESTAMPTZ DEFAULT NOW(),
  duration_sec INT DEFAULT 0,
  outcome TEXT NOT NULL DEFAULT 'not_reached'
    CHECK (outcome IN ('not_reached','reached','interested','not_interested','callback','voicemail','wrong_number')),
  language_used TEXT DEFAULT 'de'
    CHECK (language_used IN ('de','de-AT','de-CH','en')),
  email_collected TEXT,                  -- Email die im Call gesammelt wurde
  callback_time TIMESTAMPTZ,             -- Wenn Rückruf gewünscht
  transcript TEXT,                       -- Call Transkript von Bland.ai
  notes TEXT,
  cost_eur NUMERIC(6,4) DEFAULT 0,       -- Kosten in € (Dauer × Rate)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Budget-Tracking pro Tag
CREATE TABLE IF NOT EXISTS sales_budget_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES sales_campaigns(id) ON DELETE CASCADE,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  calls_made INT DEFAULT 0,
  calls_reached INT DEFAULT 0,
  calls_interested INT DEFAULT 0,
  emails_sent INT DEFAULT 0,
  cost_calls_eur NUMERIC(8,2) DEFAULT 0,
  cost_emails_eur NUMERIC(8,2) DEFAULT 0,
  signups INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(campaign_id, log_date)
);

-- 5. Foreign Key auf leads
ALTER TABLE leads
  ADD CONSTRAINT IF NOT EXISTS leads_campaign_id_fkey
  FOREIGN KEY (campaign_id) REFERENCES sales_campaigns(id) ON DELETE SET NULL;

-- 6. Indexes
CREATE INDEX IF NOT EXISTS idx_sales_calls_lead_id ON sales_calls(lead_id);
CREATE INDEX IF NOT EXISTS idx_sales_calls_campaign_id ON sales_calls(campaign_id);
CREATE INDEX IF NOT EXISTS idx_sales_calls_called_at ON sales_calls(called_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_campaign_id ON leads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_leads_call_status ON leads(call_status);
CREATE INDEX IF NOT EXISTS idx_leads_country ON leads(country);

-- 7. RLS aktivieren
ALTER TABLE sales_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_budget_log ENABLE ROW LEVEL SECURITY;

-- Nur Admins haben Zugriff
CREATE POLICY "admin_all_campaigns" ON sales_campaigns
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "admin_all_calls" ON sales_calls
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "admin_all_budget_log" ON sales_budget_log
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 8. Funktion: daily_reports automatisch aktualisieren
CREATE OR REPLACE FUNCTION update_daily_report_from_call()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO daily_reports (report_date, new_leads, emails_sent, emails_opened, replies_received, mrr_current, linkedin_posts_today)
  VALUES (CURRENT_DATE, 0, 0, 0, 0, 0, 0)
  ON CONFLICT (report_date) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
