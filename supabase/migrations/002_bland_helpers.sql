-- CHMetrics Admin — Bland.ai Hilfsfunktionen
-- Ausführen im Supabase SQL Editor nach Migration 001

-- Funktion: Kampagnen-Kosten inkrementieren
CREATE OR REPLACE FUNCTION increment_campaign_spent(
  p_campaign_id UUID,
  p_amount NUMERIC
)
RETURNS void AS $$
BEGIN
  UPDATE sales_campaigns
  SET spent_eur = spent_eur + p_amount,
      updated_at = NOW()
  WHERE id = p_campaign_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
