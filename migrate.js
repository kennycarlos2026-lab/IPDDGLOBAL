// ============================================================
// IPDD MIGRATE — migrate.js
// Migra todos los datos del CSV hardcodeado a Supabase.
// Ejecutar UNA SOLA VEZ:  node migrate.js
//
// Requiere: SUPABASE_URL y SUPABASE_KEY en este archivo
//           o en un .env local
// ============================================================

const { createClient } = require('@supabase/supabase-js');

// ── Credenciales Supabase ────────────────────────────────────
const SUPABASE_URL = 'https://cmphsgbieupmqjvqedix.supabase.co';
const SUPABASE_KEY = 'sb_publishable_HO12D11b34-b6MXOU9AOXQ__20giRiu';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── CSV hardcodeado (copiado del HTML original) ───────────────
const rawCsvData = `ESTADO,NOME IPDD,ENDEREÇO,HORARIO,PASTOR
Ceará,Fortaleza - Ceará,"Rua rosinha Sampaio 2006 - Bairro Jardim Guanabara","Domingo as 15 horas, Quarta as 19h, Sexta as 19h",Lidel Pinto Dos Santos
Ceará,Irauçuba,"Avenida Paulo Bastos - Bairro centro",Quartas e domingos as 19h,Pastor Elito dos Santos
Ceará,Independência,"Avenida 7 de setembro 879",Quartas e domingos às 19 horas,Gilmar Rodrigues
Goiás - GO,Anápolis,"Avenida Araguaia 240 esquina com a rua 15",Todos os dias das 19h às 21h e Quarta e Sabado às 8h,Eurípedes Moreira Da Silva
Goiás - GO,Goianesia,"R. 18 A , esquina com rua dos Pinheiros","Domingo, Terca, Quarta, Quinta, Sexta feira ás 19:00h",Oscalino
Goiás - GO,Jataí,"Rua Um, 171 Hamilton Nunes, Jataí - GO","Domingo, Segunda e Sexta as 19:30hrs",Evandro
Goiás - GO,Goiânia,"Rua do estanho número 200 setor marabá","Domingos, quartas e sextas às 19:30h",Gabriel
Distrito Federal - DF,Brasilia - Ceilândia,"Shsn trecho 3 chácara 66 lote 25 sol nascente ceilandia DF","Terça, Quinta e Sabado as 19:30",Pr Orlei
Distrito Federal - DF,Brasilia (Gama),"Quadra 07 lote 05/06 setor sul do gama /DF","Quarta , sexta e domingo as 19:30h",Pr Orlei
Mato Grosso do Sul,Maracaju,"Rua valeriano de castro n150 vila juquita","Domingo às 09:00 e quarta-feira às 19:00 hrs",Sidney José Pereira
Mato Grosso do Sul,Três Lagoas,"Rua Maria moreira de Queiroz (antiga Viela 2) n°59 - B. guanabara","Quarta, sexta e domingo as 19 hrs",Pastor Creles
Mato Grosso do Sul,Figueirão,"Avenida moises de araujo galvao","Domingo quarta e sexta as 19h",Evandro
Mato Grosso do Sul,Douradina,"Rua José Carlos da Silva, 549 Vila das Flores","Terca, Quinta, Domingo as 19h",João Isnarde
Espírito Santo,Aracruz - ES,"Rua dos cedros 35, bairro cohab 4","Domingo quarta e sexta as 19:30h",Adenir Lima Alexandre
Espírito Santo,Itarana - ES,"Rua jerônimo monteiro numero 54 centro, galeria lili bar","Domingo 19:00 h, Quarta-feira 19:00",Adenir Lima Alexandre
Espírito Santo,Vila Valério (Paraíso),"Avenida padre domingos bairro paraíso numero 474","Quarta, sexta, domingo 19:00h",Pastor Alex
Espírito Santo,Vila Valério (Centro),"Rua vereador Luiz calmon. N °32. Centro","Domingo as 19:00h",Gleidistone Silva
Espírito Santo,Aracruz (Pau-Brasil),"Rua dos cravos, sn. Bairro pau brasil, Aracruz es.","Terca as 19:30h",Aldenir Silva Alexandre
Espírito Santo,Lagoa de Carapebus,"Rua dos mineiros, bairro lagoa de carapebus n 18","Sexta, domingo 19:30h",Aldenir Silva Alexandre
Espírito Santo,Guaçuí,"Rod ES-484 , Br 482 - São tiago guaçuí","Domingo e Quinta feira as 19hs",Joceli Moura
Minas Gerais - MG,Nova Serrana,"Rua Equador n 10 bairro bela vista","Domingo, Quarta e Sexta as 19:30hs",Vitor Alves
Minas Gerais - MG,Pouso Alegre,"Bairro cidade jardim rua Pedro Ribeiro de Souza n- 135",Domingo e quinta 19:30,Luis Carlos
Minas Gerais - MG,Pedra Bonita,"Rua são José s/n",Domingos E quarta as 19horas,Valdinei Abraao de Oliveira
Minas Gerais - MG,Vespasiano,"Rua Tiradentes, número 355",Domingo /Quarta e Quinta As 19h30,Geraldo Lúcio
Minas Gerais - MG,São João das missões,"Rua do Campo, sem número / aldeia itapicu","Dom, seg, quarta as 19h",Ovenilson Macedo
Minas Gerais - MG,Turmalina,"Avenida Brasília, n: 671,  bairro campo alegre","Domingo , Quarta e Quinta  às 19:30",José Antônio Gomes
Minas Gerais - MG,Estrela do Sul,"Rua Alvino Viana - número 88. Bairro centro","Domingo as 18:30 horas",Pascoal Cardoso da Silva Neto
Minas Gerais - MG,Belo Horizonte,"Rua treze de setembro 741 providência",Segunda a segunda as 19h,Pr Ivonei
Minas Gerais - MG,Brumadinho,"Rua Euticiano da Silva número 62 bairro são Bento",Quarta e sábado,Pr Ivonei
Minas Gerais - MG,Ipatinga,"Rua periquito 263 vila celeste Ipatinga mg",Todos os dias as 19;30,Pr Jurandi
Minas Gerais - MG,Itamuri,"Rua Sebastião de paula neto, 381",Terça a sabado as 19h,Leonardo
Minas Gerais - MG,Três Corações,"Av 7 de setembro , número 63",Terça as 19h e domingo as 9h,Sebastião
Minas Gerais - MG,Capetinga,"Rua Manoel Teodoro de paula numero 219",Sabado e domingo as 19:30h,Pedro
São Paulo - SP,JARAGUÁ SEDE INTERNACIONAL,"Estr. de Taipas, 1999 - Jaraguá","Domingo as 9h - Quinta, Sexta as 20h",Pr Miguel
São Paulo - SP,Salto,"Av D. Pedro II, 1436","Terça, Quinta, Sábado, e Domingo as 19h30",Nilton Francisco de Sousa
São Paulo - SP,Registro,"Rua Rio grande do Sul 530 - Jardim Paulistano","Domingo a quarta - as 19:30",Pr Marcelo
São Paulo - SP,Mogi das Cruzes,"Rua Euzébio de paula leito","Terca, Quinta, Sexta, Sabado e Domingo 19hs",Pastor Isaias
São Paulo - SP,Itaquaquecetuba - SP,Endereço Antigo da Sede,-,FECHADO
São Paulo - SP,Paraibuna,"Rua padre Vicente,119. Bairro alferes Benedito","Segunda, Quarta e Sexta e Domingo às 19:30hs",João Pereira
São Paulo - SP,Ilha-Bela,"Rua Santa Teresa 319, água branca ilha bela -sp",Terça quinta sexta sábado e domingo as 19:30,André Ricardo
São Paulo - SP,Várzea Paulista,"Rua São Carlos ,16 Jardim América 4 ,várzea Paulista SP",Terca quinta e sábado,Nirceu Da Silva Ferreira
São Paulo - SP,Ermelino Matarazzo,"Rua São Bertolomeu 391",Quinta e domingo,Pr Miguel
São Paulo - SP,Iguape,"Rodovia prefeito casimiro teixeira N 7349",Sexta as 19:30,Pr Marcelo
São Paulo - SP,Guaratinguetá,"Rua Expedicionários de guaratingueta n222 ,  santa luzia","Terça a sexta-feira  19:30 , domingo  19hrs",João Nunes
São Paulo - SP,Capão Redondo-SP,"Rua valeriano de castro n150",Segunda a domingo 19h,Jocisnaldo
São Paulo - SP,Campinas,"Rua da campinas S/N",Todos os dias 19h,Pr Nilton
São Paulo - SP,Itapira - SP,"Endereço central itapira",Quarta e domingo,Hélio
São Paulo - SP,Itatiba - SP,"Rua itatiba",Terca e sexta,Nirceu Da Silva Ferreira
São Paulo - SP,Serra Negra,"Rua serra negra S/N",Domingos as 19h,Hélio
São Paulo - SP,Jaú - SP,"Avenida Principal de Jaú",Todos os dias 20h,Nilton Francisco de Sousa
São Paulo - SP,Itaquaquecetuba (Corredor),"Rua do Corredor",Sextas,Pr Jose Carlos
São Paulo - SP,Campo Limpo,"Rua Campo Limpo S/N",Todos os dias 19:30h,Pr Clovis
São Paulo - SP,Francisco Morato,"Rua Francisco Morato",Terca a Sabado 19h,Pr Carlos
Rio de Janeiro,Varresai,"Rua Manoel Martins figueiredo",Todos os dias as 19h,Rogerio Miranda Alves
Rio de Janeiro,Itaboraí,"Rua 29 Qd 118 Lt 12 / N°12.  Bairro Apolo lll","Quartas e sextas ás 19h30,  domingos as 18h",Edimilson Oliveira
Rio de Janeiro,Campo Grande,"Estrada Rio São Paulo, número 5262",Segundas e domingos ás 19h30,Edmilson Oliveira
Rio de Janeiro,Ourânia,"Rua maria lúcia  n° 165 distrito de ourania",Quartas e sábados as 19h,Dionnatan Silva
Rio de Janeiro,Rosal - Itabapoana,"Av. Pr. Samuel Henrique Werneck","Domingo, Terça, Quinta, Sexta-feiras as 19hrs",Rogerio Miranda Alves
Rio de Janeiro,Petrópolis - RJ,"Estrada do Carangola número 935 A","Domingo a segunda as 19:30",Edimilson Oliveira
Rio de Janeiro,Angra dos Reis,"Rua das pedras n 18 Angra dos Reis RJ",Terca e quinta 19h,Eliezer
Paraná - PR,Prudentópolis (Delmira),"Prudentópolis Vila Delmira",Domingo Terça Sexta às 19:30,Pastor Aparício da Silva
Paraná - PR,Prudentópolis (Rural),"Faxinal Prudentópolis rural",Sabado As 19h,Pastor Aparício da Silva
Paraná - PR,PARANAGUÁ,"Rua do Paranaguá",Todos os dias as 19h,Pr José
Rio Grande do Sul - RS,Canoas,"Rua Ceará, 381 Bairro Mathias velho",Terca a Domingo 20h,Wesley F.
Rio Grande do Sul - RS,Viamão,"Estrada boqueirão 297 ,bairro elza","Domingos, terça, quinta e sábado, às 19:30",Élito
Rio Grande do Sul - RS,Tramandaí,"Rua : vereador Ceni borges monteiro 371. Pq dos presidentes","Domingo , Quarta ,Sexta   As 19:30 h",Lucas Machado
Rio Grande do Sul - RS,Irai,"Rua 23 de Maio 125, vila militar Irai",Domingos E Quarta 19:30,Luiz Francisco
Rio Grande do Sul - RS,Jaguarão,"Rua 24 de maio , bairro Pindorama n42","Domingo E Quarta feira ,  h 20:00",Erasmo Rodrigues
Rio Grande do Sul - RS,Cacique Doble,"Av Kaigang 1672",Sábado E Domingo 19:30h,Zaqueu Pinto
Rio Grande do Sul - RS,Porto Alegre,"Rua São Luis porto alegre",Terca as 19h,Elton Ortiz
Santa Catarina,Rio d´Oeste,"Rodovia SC 350 , N° 3500 , bairro João Nardelli","Quartas e Sextas -feiras ás 20:00h",Pr Diego Cesar
Santa Catarina,Palhoça Brejaru,"Rua Joõa do Carmos lopes",Quarta a sabado as 19h,Pastor Samuel
Santa Catarina,Joinville,"Joinville bairo Jardim iririu rua papa João Paulo 1 número 475","quartas 19h, sexta 19h e domingo a las 18h",Cleones Marchi
Santa Catarina,Rio do Sul,"Rio do Sul, bairro Barragen, estrada da Madeira 1530","terça 19h, quinta 19h , sábados 19h , Domingo 18h",Valdir Cristiano Wessner
Acre,Rio Branco,"Rua São Raimundo Nonato, 656 Vitória, Rio Branco","Do,Ter, Qua, Qui, Sex, Sab ás 19h",Eldo Lima
Cusco - Perú,Sicuani,"Jirón Ayacucho No. 209 con la av. Manuel callo zevallos","miercoles y domingo 9am - martes 7pm y viernes 8pm",Pr Alfonso
Lima - Perú,Lima - Ventanilla,"Calle 3 Mz. J Lte 13 - Kumamoto","Miercoles a las 7pm y Domingo a las 10am",cultos en el Hogar
Arequipa -Perú,Pedregal - Majes,"Av. Arequipa Mz. B6 Lote 19 Modulo A sector 3","Martes 7.00.pm, Miércoles 9.00 am, Viernes vigilia 8.00 pm, Domingo 9",Pr Alfonso
Huánuco - Perú,Huánuco,"Rua principal huanuco",Todos los dias 19h,Pr David
Puerto Maldonado - Perú,Puerto Maldonado,"Calle madre de dios",Lunes a Sabado 19h,Pr Jorge`;

// ── Funciones de parseo (igual que el JS del HTML) ────────────
function parseCSV(str) {
  let arr = []; let quote = false; let row = 0; let col = 0;
  for (let c = 0; c < str.length; c++) {
    let cc = str[c], nc = str[c+1];
    arr[row] = arr[row] || [];
    arr[row][col] = arr[row][col] || '';
    if (cc == '"' && quote && nc == '"') { arr[row][col] += cc; ++c; continue; }
    if (cc == '"') { quote = !quote; continue; }
    if (cc == ',' && !quote) { ++col; continue; }
    if (cc == '\r' && nc == '\n' && !quote) { ++row; col = 0; ++c; continue; }
    if (cc == '\n' && !quote) { ++row; col = 0; continue; }
    if (cc == '\r' && !quote) { ++row; col = 0; continue; }
    arr[row][col] += cc;
  }
  return arr;
}

function getCountryCode(countryName) {
  if (!countryName) return 'XX';
  let name = countryName.trim().toUpperCase();
  if (name.includes('BRASIL')) return 'BR';
  if (name.includes('PERÚ') || name.includes('PERU')) return 'PE';
  return name.substring(0, 2);
}

const brasilStateCodes = {
  'CEARÁ': 'CE', 'GOIÁS': 'GO', 'GOIÁS - GO': 'GO',
  'DISTRITO FEDERAL': 'DF', 'DISTRITO FEDERAL - DF': 'DF',
  'MATO GROSSO DO SUL': 'MS', 'ESPÍRITO SANTO': 'ES',
  'MINAS GERAIS': 'MG', 'MINAS GERAIS - MG': 'MG',
  'SÃO PAULO': 'SP', 'SÃO PAULO - SP': 'SP',
  'RIO DE JANEIRO': 'RJ', 'PARANÁ': 'PR', 'PARANÁ - PR': 'PR',
  'RIO GRANDE DO SUL': 'RS', 'RIO GRANDE DO SUL - RS': 'RS',
  'SANTA CATARINA': 'SC', 'ACRE': 'AC'
};

function getStateAbbr(countryName, estadoName) {
  if (!estadoName) return 'XX';
  let estClean = estadoName.trim().toUpperCase();
  let cName = countryName.trim().toUpperCase();
  if (cName.includes('BRASIL')) return brasilStateCodes[estClean] || estClean.substring(0, 2);
  let parts = estClean.split('-');
  return parts[0].trim().substring(0, 2);
}

// ── Función principal de migración ────────────────────────────
async function migrate() {
  console.log('');
  console.log('╔════════════════════════════════════════════╗');
  console.log('║   IPDD — Migración CSV → Supabase          ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log('');
  console.log('Conectando a Supabase...');

  // Test de conexión
  const { data: testData, error: testError } = await supabase
    .from('churches')
    .select('id')
    .limit(1);

  if (testError) {
    console.error('❌ Error de conexión:', testError.message);
    console.error('   Verifica que el schema SQL fue ejecutado en Supabase.');
    process.exit(1);
  }

  console.log('✅ Conexión OK');

  // Verificar si ya hay datos
  const { count } = await supabase
    .from('churches')
    .select('*', { count: 'exact', head: true });

  if (count > 0) {
    console.log(`\n⚠️  Ya existen ${count} sedes en la base de datos.`);
    console.log('   Para evitar duplicados, la migración se detendrá.');
    console.log('   Si deseas re-migrar, elimina los datos de la tabla churches primero.');
    console.log('   (Dashboard → Table Editor → churches → Delete all rows)\n');
    process.exit(0);
  }

  // Parsear CSV
  let parsedLines = parseCSV(rawCsvData);
  let counters = {};
  let churchesToInsert = [];
  let monthlyToInsert = [];
  let counterUpdates = [];

  console.log(`📋 Procesando ${parsedLines.length - 1} sedes del CSV...`);

  for (let i = 1; i < parsedLines.length; i++) {
    let parts = parsedLines[i];
    if (parts.length < 5) continue;

    let estado   = parts[0].trim();
    let nombre   = parts[1].trim();
    let address  = parts[2].trim();
    let horario  = parts[3].trim();
    let pastor   = parts[4].trim();

    let country     = estado.toLowerCase().includes('perú') ? 'Perú' : 'Brasil';
    let countryCode = getCountryCode(country);
    let stateCode   = getStateAbbr(country, estado);
    let prefixKey   = `${countryCode} ${stateCode}`;

    if (!counters[prefixKey]) counters[prefixKey] = 0;
    counters[prefixKey]++;

    let finalId     = `${prefixKey}-${String(counters[prefixKey]).padStart(3, '0')}`;
    let phonePrefix = country === 'Brasil' ? '+55 ' : '+51 ';
    let status      = (pastor.toUpperCase().includes('FECHADO') || nombre.toUpperCase().includes('FECHADO'))
      ? 'Cerrada' : 'Abierta';

    // Church record
    churchesToInsert.push({
      id:                   finalId,
      pais:                 country,
      estado:               estado,
      ciudad:               nombre,
      nombre_iglesia:       `IPDD ${nombre}`,
      direccion:            address,
      email_iglesia:        `contato.${nombre.toLowerCase().replace(/ /g,'')}@ipddglobal.org`,
      estatus_iglesia:      status,
      dias_culto:           horario,
      dirigente1_nome:      pastor,
      dirigente1_tel:       phonePrefix,
      dirigente2_nome:      'No asignado',
      dirigente2_tel:       phonePrefix,
      financiero1_nome:     'No asignado',
      financiero1_tel:      phonePrefix,
      financiero2_nome:     'No asignado',
      financiero2_tel:      phonePrefix,
      tipo_local:           'Alquilado',
      contrato_estado:      status === 'Abierta' ? 'Vigente' : 'Sin Contrato',
      contrato_titular:     'IPDD Sede Central',
      contrato_inicio:      status === 'Abierta' ? '2023-06-01' : null,
      contrato_fin:         status === 'Abierta' ? '2026-12-31' : null,
      contrato_monto_mensual: status === 'Abierta' ? 1200 : 0,
      inventario_bienes:    'Sillas, Púlpito.'
    });

    // Monthly reports — generar histórico 2023-06 a 2026-06
    let d = new Date(2023, 5, 1);
    let endD = new Date(2026, 5, 1);
    let offset = 0;
    while (d <= endD) {
      let mk = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
      monthlyToInsert.push({
        church_id:             finalId,
        month_key:             mk,
        entrada:               status === 'Abierta' ? 1250 + (offset * 15) : 0,
        saida:                 status === 'Abierta' ? 450  + (offset * 5) : 0,
        saldo:                 status === 'Abierta' ? 800  + (offset * 10) : 0,
        envio_relatorio:       status === 'Abierta' ? 'SIM' : 'NÃO',
        custodio_llave_nombre: status === 'Abierta' ? `Pr. ${pastor}` : '-',
        custodio_llave_tel:    status === 'Abierta' ? phonePrefix : '',
        custodio_pass_nombre:  status === 'Abierta' ? `Pr. ${pastor}` : '-',
        custodio_pass_tel:     status === 'Abierta' ? phonePrefix : '',
        obs_cofre:             status === 'Abierta' ? 'Cofre operativo.' : 'Cerrada.'
      });
      d.setMonth(d.getMonth() + 1);
      offset++;
    }
  }

  // id_counters
  for (let [prefix, count] of Object.entries(counters)) {
    counterUpdates.push({ prefix_key: prefix, last_number: count });
  }

  // ── Insertar en lotes ────────────────────────────────────────
  console.log(`\n📤 Insertando ${churchesToInsert.length} sedes en Supabase...`);
  const { error: churchErr } = await supabase
    .from('churches')
    .insert(churchesToInsert);

  if (churchErr) {
    console.error('❌ Error al insertar sedes:', churchErr.message);
    process.exit(1);
  }
  console.log(`   ✅ ${churchesToInsert.length} sedes insertadas`);

  // Insertar monthly_reports en lotes de 200 (límite de Supabase)
  console.log(`\n📤 Insertando ${monthlyToInsert.length} registros mensuales...`);
  const BATCH_SIZE = 200;
  let inserted = 0;
  for (let i = 0; i < monthlyToInsert.length; i += BATCH_SIZE) {
    const batch = monthlyToInsert.slice(i, i + BATCH_SIZE);
    const { error: mErr } = await supabase.from('monthly_reports').insert(batch);
    if (mErr) {
      console.error(`❌ Error al insertar lote monthly [${i}-${i+BATCH_SIZE}]:`, mErr.message);
      process.exit(1);
    }
    inserted += batch.length;
    process.stdout.write(`\r   ✅ ${inserted}/${monthlyToInsert.length} registros...`);
  }
  console.log('');

  // Insertar contadores
  console.log(`\n📤 Actualizando ${counterUpdates.length} contadores de ID...`);
  const { error: cntErr } = await supabase
    .from('id_counters')
    .upsert(counterUpdates);

  if (cntErr) {
    console.error('❌ Error al insertar contadores:', cntErr.message);
    process.exit(1);
  }
  console.log(`   ✅ ${counterUpdates.length} contadores actualizados`);

  console.log('');
  console.log('╔════════════════════════════════════════════╗');
  console.log('║   ✅ MIGRACIÓN COMPLETADA EXITOSAMENTE     ║');
  console.log(`║   Sedes: ${String(churchesToInsert.length).padEnd(4)} | Monthly: ${String(monthlyToInsert.length).padEnd(6)} registros ║`);
  console.log('╚════════════════════════════════════════════╝');
  console.log('');
  console.log('Próximo paso: Inicia la app HTML y verifica que carga los datos.');
}

migrate().catch(err => {
  console.error('❌ Error inesperado:', err);
  process.exit(1);
});
