import pg from 'pg';

const { Client } = pg;

async function verifyPhase1() {
  console.log('🔍 VERIFICAÇÃO DA FASE 1 - MODELAGEM DE DADOS\n');
  console.log('='.repeat(50));

  const errors = [];
  const warnings = [];
  let checksCompleted = 0;
  const totalChecks = 10;

  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_bdaE9x2yiYWL@ep-delicate-pine-a4eh947l.us-east-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    // 1. Verificar tabelas criadas
    console.log('\n1️⃣ Verificando tabelas criadas...');
    const tablesQuery = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN (
        'diagnostic_service_config',
        'vehicle_pricing',
        'appointment_slots',
        'appointment_exceptions',
        'appointment_settings'
      )
      ORDER BY table_name;
    `;

    const tablesResult = await client.query(tablesQuery);
    const expectedTables = 5;

    if (tablesResult.rows.length === expectedTables) {
      console.log(`   ✅ Todas as ${expectedTables} tabelas foram criadas`);
      tablesResult.rows.forEach(row => {
        console.log(`      • ${row.table_name}`);
      });
      checksCompleted++;
    } else {
      errors.push(`Esperadas ${expectedTables} tabelas, encontradas ${tablesResult.rows.length}`);
      console.log(`   ❌ Apenas ${tablesResult.rows.length} de ${expectedTables} tabelas foram criadas`);
    }

    // 2. Verificar colunas adicionadas em appointments
    console.log('\n2️⃣ Verificando colunas adicionadas em appointments...');
    const columnsQuery = `
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'appointments'
      AND column_name IN (
        'vehicle_category',
        'final_price',
        'check_in_time',
        'check_out_time',
        'service_rating',
        'customer_consent',
        'reminder_sent_at',
        'cancelled_by',
        'cancellation_reason'
      )
      ORDER BY column_name;
    `;

    const columnsResult = await client.query(columnsQuery);
    const expectedColumns = 9;

    if (columnsResult.rows.length === expectedColumns) {
      console.log(`   ✅ Todas as ${expectedColumns} colunas foram adicionadas`);
      checksCompleted++;
    } else {
      errors.push(`Esperadas ${expectedColumns} colunas, encontradas ${columnsResult.rows.length}`);
      console.log(`   ❌ Apenas ${columnsResult.rows.length} de ${expectedColumns} colunas foram adicionadas`);
    }

    // 3. Verificar índices criados
    console.log('\n3️⃣ Verificando índices de performance...');
    const indexesQuery = `
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
      AND tablename IN (
        'diagnostic_service_config',
        'vehicle_pricing',
        'appointment_slots',
        'appointment_exceptions',
        'appointment_settings',
        'appointments'
      )
      AND indexname LIKE 'idx_%';
    `;

    const indexesResult = await client.query(indexesQuery);

    if (indexesResult.rows.length > 0) {
      console.log(`   ✅ ${indexesResult.rows.length} índices de performance criados`);
      checksCompleted++;
    } else {
      warnings.push('Nenhum índice de performance encontrado');
      console.log(`   ⚠️ Nenhum índice de performance encontrado`);
    }

    // 4. Verificar constraints
    console.log('\n4️⃣ Verificando constraints de integridade...');
    const constraintsQuery = `
      SELECT
        tc.table_name,
        tc.constraint_name,
        tc.constraint_type
      FROM information_schema.table_constraints tc
      WHERE tc.table_schema = 'public'
      AND tc.table_name IN (
        'diagnostic_service_config',
        'vehicle_pricing',
        'appointment_slots'
      )
      AND tc.constraint_type IN ('CHECK', 'UNIQUE', 'FOREIGN KEY')
      ORDER BY tc.table_name, tc.constraint_type;
    `;

    const constraintsResult = await client.query(constraintsQuery);

    if (constraintsResult.rows.length > 0) {
      console.log(`   ✅ ${constraintsResult.rows.length} constraints configuradas`);
      checksCompleted++;
    } else {
      warnings.push('Nenhuma constraint adicional encontrada');
      console.log(`   ⚠️ Nenhuma constraint adicional encontrada`);
    }

    // 5. Verificar triggers
    console.log('\n5️⃣ Verificando triggers de updated_at...');
    const triggersQuery = `
      SELECT
        trigger_name,
        event_object_table
      FROM information_schema.triggers
      WHERE trigger_schema = 'public'
      AND trigger_name LIKE '%updated_at%';
    `;

    const triggersResult = await client.query(triggersQuery);

    if (triggersResult.rows.length >= 4) {
      console.log(`   ✅ ${triggersResult.rows.length} triggers configurados`);
      checksCompleted++;
    } else {
      warnings.push(`Apenas ${triggersResult.rows.length} triggers encontrados (esperados 4+)`);
      console.log(`   ⚠️ Apenas ${triggersResult.rows.length} triggers encontrados`);
    }

    // 6. Testar inserção em diagnostic_service_config
    console.log('\n6️⃣ Testando inserção em diagnostic_service_config...');
    try {
      // Buscar primeira oficina
      const workshopResult = await client.query('SELECT id FROM workshops LIMIT 1');

      if (workshopResult.rows.length > 0) {
        const workshopId = workshopResult.rows[0].id;

        // Verificar se já existe configuração
        const existsResult = await client.query(
          'SELECT id FROM diagnostic_service_config WHERE workshop_id = $1',
          [workshopId]
        );

        if (existsResult.rows.length === 0) {
          // Inserir configuração teste
          await client.query(`
            INSERT INTO diagnostic_service_config (workshop_id, is_active, status)
            VALUES ($1, false, 'disabled')
            ON CONFLICT (workshop_id) DO NOTHING
          `, [workshopId]);

          console.log(`   ✅ Inserção teste bem-sucedida`);
        } else {
          console.log(`   ✅ Configuração já existe para workshop ${workshopId}`);
        }
        checksCompleted++;
      } else {
        warnings.push('Nenhuma oficina encontrada para teste');
        console.log(`   ⚠️ Nenhuma oficina encontrada para teste`);
      }
    } catch (insertError) {
      errors.push(`Erro ao testar inserção: ${insertError.message}`);
      console.log(`   ❌ Erro ao testar inserção: ${insertError.message}`);
    }

    // 7. Testar inserção em vehicle_pricing
    console.log('\n7️⃣ Testando inserção em vehicle_pricing...');
    try {
      const workshopResult = await client.query('SELECT id FROM workshops LIMIT 1');

      if (workshopResult.rows.length > 0) {
        const workshopId = workshopResult.rows[0].id;

        // Inserir preço teste (ignorar se já existir)
        await client.query(`
          INSERT INTO vehicle_pricing (workshop_id, category, price, estimated_duration)
          VALUES ($1, 'popular', 15000, 60)
          ON CONFLICT (workshop_id, category) DO NOTHING
        `, [workshopId]);

        console.log(`   ✅ Inserção de preço teste bem-sucedida`);
        checksCompleted++;
      }
    } catch (insertError) {
      errors.push(`Erro ao testar vehicle_pricing: ${insertError.message}`);
      console.log(`   ❌ Erro: ${insertError.message}`);
    }

    // 8. Verificar relacionamentos entre tabelas
    console.log('\n8️⃣ Testando relacionamentos entre tabelas...');
    try {
      // Testar join entre tabelas
      const joinQuery = `
        SELECT
          dsc.id,
          dsc.status,
          w.name as workshop_name
        FROM diagnostic_service_config dsc
        JOIN workshops w ON w.id = dsc.workshop_id
        LIMIT 1;
      `;

      const joinResult = await client.query(joinQuery);
      console.log(`   ✅ Relacionamentos entre tabelas funcionando`);
      checksCompleted++;
    } catch (joinError) {
      errors.push(`Erro ao testar relacionamentos: ${joinError.message}`);
      console.log(`   ❌ Erro ao testar joins: ${joinError.message}`);
    }

    // 9. Verificar configurações padrão
    console.log('\n9️⃣ Verificando configurações padrão...');
    const defaultsQuery = `
      SELECT count(*) as total
      FROM appointment_settings;
    `;

    const defaultsResult = await client.query(defaultsQuery);

    if (defaultsResult.rows[0].total > 0) {
      console.log(`   ✅ ${defaultsResult.rows[0].total} configurações padrão criadas`);
      checksCompleted++;
    } else {
      warnings.push('Nenhuma configuração padrão criada');
      console.log(`   ⚠️ Nenhuma configuração padrão encontrada`);
    }

    // 10. Verificar integridade referencial
    console.log('\n10. Verificando integridade referencial...');
    const fkQuery = `
      SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name IN (
        'diagnostic_service_config',
        'vehicle_pricing',
        'appointment_slots',
        'appointment_exceptions',
        'appointment_settings'
      );
    `;

    const fkResult = await client.query(fkQuery);

    if (fkResult.rows.length >= 5) {
      console.log(`   ✅ ${fkResult.rows.length} chaves estrangeiras configuradas`);
      checksCompleted++;
    } else {
      errors.push(`Apenas ${fkResult.rows.length} FKs encontradas (esperadas 5+)`);
      console.log(`   ❌ Apenas ${fkResult.rows.length} chaves estrangeiras encontradas`);
    }

    // RESULTADO FINAL
    console.log('\n' + '='.repeat(50));
    console.log('📊 RESULTADO DA VERIFICAÇÃO\n');

    const successRate = (checksCompleted / totalChecks) * 100;

    console.log(`✅ Verificações bem-sucedidas: ${checksCompleted}/${totalChecks} (${successRate.toFixed(0)}%)`);

    if (errors.length > 0) {
      console.log(`\n❌ ERROS ENCONTRADOS (${errors.length}):`);
      errors.forEach(error => console.log(`   • ${error}`));
    }

    if (warnings.length > 0) {
      console.log(`\n⚠️ AVISOS (${warnings.length}):`);
      warnings.forEach(warning => console.log(`   • ${warning}`));
    }

    // Decisão final
    console.log('\n' + '='.repeat(50));
    if (errors.length === 0 && successRate >= 80) {
      console.log('✅ FASE 1 APROVADA! Pronto para prosseguir para Fase 2.');
      process.exit(0);
    } else if (errors.length > 0) {
      console.log('❌ FASE 1 COM PROBLEMAS! Correções necessárias antes de prosseguir.');
      process.exit(1);
    } else {
      console.log('⚠️ FASE 1 PARCIALMENTE COMPLETA. Revisar avisos antes de prosseguir.');
      process.exit(0);
    }

  } catch (error) {
    console.error('\n❌ Erro crítico durante verificação:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Executar verificação
verifyPhase1();