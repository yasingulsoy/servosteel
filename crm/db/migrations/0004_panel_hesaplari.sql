-- Sitenin yönetim paneli hesapları (yoneticiler tablosu) CRM'e de girer.
-- panel_bagli satırın parolası CRM'de tutulmaz: girişte sitenin karmasıyla
-- doğrulanır, böylece panelde değişen parola CRM'de de geçerli olur.
-- karma sütunu bu satırlarda yalnız yer tutucu ('panel').
ALTER TABLE crm_kullanici ADD COLUMN panel_bagli BOOLEAN NOT NULL DEFAULT false;
