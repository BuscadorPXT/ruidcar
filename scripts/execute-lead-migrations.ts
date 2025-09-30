import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function executeMigrations() {
  console.log("🚀 Executando migrations do sistema de leads...\n");

  try {
    // Migration 1: Add fields to contact_messages
    console.log("📋 Migration 1: Adicionando campos na tabela contact_messages...");

    await db.execute(sql`
      ALTER TABLE contact_messages
      ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'new',
      ADD COLUMN IF NOT EXISTS assigned_to INTEGER REFERENCES users(id),
      ADD COLUMN IF NOT EXISTS lead_score INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS tags TEXT[],
      ADD COLUMN IF NOT EXISTS next_action_date DATE,
      ADD COLUMN IF NOT EXISTS conversion_date TIMESTAMP,
      ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
      ADD COLUMN IF NOT EXISTS internal_notes TEXT,
      ADD COLUMN IF NOT EXISTS interaction_count INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS last_interaction TIMESTAMP,
      ADD COLUMN IF NOT EXISTS city TEXT,
      ADD COLUMN IF NOT EXISTS state TEXT
    `);

    // Create indexes
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_contact_messages_assigned_to ON contact_messages(assigned_to)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_contact_messages_lead_score ON contact_messages(lead_score DESC)`);

    // Update existing records
    await db.execute(sql`UPDATE contact_messages SET status = 'new' WHERE status IS NULL`);

    console.log("✅ Campos adicionados com sucesso!\n");

    // Migration 2: Create lead_interactions table
    console.log("📋 Migration 2: Criando tabela lead_interactions...");

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS lead_interactions (
        id SERIAL PRIMARY KEY,
        lead_id INTEGER NOT NULL REFERENCES contact_messages(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id),
        type TEXT NOT NULL CHECK (type IN ('note', 'call', 'email', 'whatsapp', 'meeting', 'system')),
        content TEXT,
        scheduled_at TIMESTAMP,
        completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_lead_interactions_lead_id ON lead_interactions(lead_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_lead_interactions_user_id ON lead_interactions(user_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_lead_interactions_type ON lead_interactions(type)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_lead_interactions_created_at ON lead_interactions(created_at DESC)`);

    // Create update trigger function
    await db.execute(sql`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);

    // Create trigger (drop first if exists)
    await db.execute(sql`DROP TRIGGER IF EXISTS update_lead_interactions_updated_at ON lead_interactions`);
    await db.execute(sql`
      CREATE TRIGGER update_lead_interactions_updated_at
      BEFORE UPDATE ON lead_interactions
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column()
    `);

    console.log("✅ Tabela lead_interactions criada com sucesso!\n");

    // Migration 3: Create lead_status_history table
    console.log("📋 Migration 3: Criando tabela lead_status_history...");

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS lead_status_history (
        id SERIAL PRIMARY KEY,
        lead_id INTEGER NOT NULL REFERENCES contact_messages(id) ON DELETE CASCADE,
        old_status TEXT,
        new_status TEXT NOT NULL,
        changed_by INTEGER NOT NULL REFERENCES users(id),
        reason TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_lead_status_history_lead_id ON lead_status_history(lead_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_lead_status_history_changed_by ON lead_status_history(changed_by)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_lead_status_history_created_at ON lead_status_history(created_at DESC)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_lead_status_history_new_status ON lead_status_history(new_status)`);

    // Create trigger function for status changes
    await db.execute(sql`
      CREATE OR REPLACE FUNCTION log_lead_status_change()
      RETURNS TRIGGER AS $$
      BEGIN
        -- Only log if status actually changed
        IF OLD.status IS DISTINCT FROM NEW.status THEN
          INSERT INTO lead_status_history (
            lead_id,
            old_status,
            new_status,
            changed_by,
            created_at
          ) VALUES (
            NEW.id,
            OLD.status,
            NEW.status,
            COALESCE(NEW.assigned_to, 1),
            CURRENT_TIMESTAMP
          );

          -- Update interaction count and last interaction
          NEW.interaction_count = COALESCE(OLD.interaction_count, 0) + 1;
          NEW.last_interaction = CURRENT_TIMESTAMP;
        END IF;

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);

    // Create trigger (drop first if exists)
    await db.execute(sql`DROP TRIGGER IF EXISTS trigger_log_lead_status_change ON contact_messages`);
    await db.execute(sql`
      CREATE TRIGGER trigger_log_lead_status_change
      AFTER UPDATE OF status ON contact_messages
      FOR EACH ROW
      EXECUTE FUNCTION log_lead_status_change()
    `);

    // Insert initial history for existing leads
    await db.execute(sql`
      INSERT INTO lead_status_history (lead_id, new_status, changed_by, reason, created_at)
      SELECT
        id,
        COALESCE(status, 'new'),
        COALESCE(user_id, 1),
        'Initial import from existing data',
        COALESCE(created_at, CURRENT_TIMESTAMP)
      FROM contact_messages
      WHERE NOT EXISTS (
        SELECT 1 FROM lead_status_history
        WHERE lead_status_history.lead_id = contact_messages.id
      )
    `);

    console.log("✅ Tabela lead_status_history criada com sucesso!\n");

    console.log("🎉 Todas as migrations foram executadas com sucesso!");
    console.log("\n📊 Resumo:");
    console.log("  - Tabela contact_messages atualizada com novos campos");
    console.log("  - Tabela lead_interactions criada");
    console.log("  - Tabela lead_status_history criada");
    console.log("  - Triggers e índices configurados");

  } catch (error) {
    console.error("❌ Erro ao executar migrations:", error);
    process.exit(1);
  }
}

// Execute
executeMigrations()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Erro fatal:", error);
    process.exit(1);
  });