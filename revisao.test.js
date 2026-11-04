import { test } from 'node:test'
import assert from 'node:assert/strict'
import { revisarCurriculo, comoTexto } from './revisao.js'
import { montar } from './curriculo.js'

const completo = montar({
  nome: 'Ana Souza',
  telefone: '21999998888',
  email: 'ana@exemplo.com',
  cidade: 'Niterói, RJ',
  objetivo: 'Trabalhar com atendimento ao público.',
  experiencias: [{ funcao: 'Cuidadora', local: 'Atendimento particular', periodo: '2022 a 2024', descricao: 'Organizava medicação e rotina.' }],
  formacoes: [{ curso: 'Ensino médio', instituicao: 'Escola Estadual', periodo: 'Concluído em 2021' }],
  habilidades: 'Atendimento, organização, Excel',
})

const codigos = (modelo) => revisarCurriculo(modelo).map((a) => a.codigo)

test('currículo completo não recebe aviso', () => {
  assert.deepEqual(revisarCurriculo(completo), [])
})

test('currículo vazio não recebe sermão sobre cada campo', () => {
  assert.deepEqual(revisarCurriculo(montar({})), [])
})

test('aponta o que falta depois que a pessoa começou', () => {
  const modelo = montar({ nome: 'Ana', telefone: '21999998888' })
  assert.deepEqual(codigos(modelo), ['sem-objetivo', 'sem-historico', 'sem-habilidades'])
})

test('aponta experiência sem descrição, citando qual é', () => {
  const modelo = { ...completo, experiencias: [{ funcao: 'Caixa', local: 'Mercado', periodo: '2024', descricao: '' }] }
  const [aviso] = revisarCurriculo(modelo)
  assert.equal(aviso.codigo, 'experiencia-sem-descricao')
  assert.match(aviso.mensagem, /Caixa/)
})

for (const [nome, texto, codigo] of [
  ['idade', 'Tenho 45 anos e procuro trabalho.', 'dado-idade'],
  ['nascimento', 'Data de nascimento: 10/02/1980.', 'dado-idade'],
  ['estado civil', 'Sou casada, moro perto.', 'dado-familia'],
  ['filhos', 'Tenho dois filhos.', 'dado-familia'],
  ['documento', 'RG 12.345.678-9', 'dado-documento'],
  ['CPF sem acento', 'cpf 123', 'dado-documento'],
  ['religião', 'Sou evangélica.', 'dado-religiao'],
]) {
  test(`avisa sobre dado que não precisa estar no currículo: ${nome}`, () => {
    assert.ok(codigos({ ...completo, objetivo: texto }).includes(codigo))
  })
}

test('não confunde tempo de experiência com idade', () => {
  assert.deepEqual(revisarCurriculo({ ...completo, objetivo: 'Tenho 10 anos de experiência em vendas.' }), [])
})

test('não confunde palavras parecidas', () => {
  assert.deepEqual(revisarCurriculo({ ...completo, objetivo: 'Fui casado com a profissão: atendo no caixa e faço pedidos.' }).filter((a) => a.codigo !== 'dado-familia'), [])
  assert.deepEqual(revisarCurriculo({ ...completo, objetivo: 'Atuei com afiliados e organização de registros.' }), [])
})

test('avisa uma vez só por tipo de dado', () => {
  const modelo = { ...completo, objetivo: 'Casada, solteira, com filhos.' }
  assert.equal(codigos(modelo).filter((c) => c === 'dado-familia').length, 1)
})

test('procura dados também na experiência e nas habilidades', () => {
  assert.ok(codigos({ ...completo, habilidades: ['Sou solteira'] }).includes('dado-familia'))
  assert.ok(codigos({ ...completo, experiencias: [{ funcao: 'Caixa', local: '', periodo: '', descricao: 'Tenho 50 anos.' }] }).includes('dado-idade'))
})

test('texto simples traz todas as seções, em ordem, para colar em formulário', () => {
  const texto = comoTexto(completo)
  assert.equal(texto.split('\n')[0], 'Ana Souza')
  assert.match(texto, /\(21\) 99999-8888 \| ana@exemplo\.com \| Niterói, RJ/)
  const ordem = ['OBJETIVO', 'EXPERIÊNCIA', 'ESTUDOS E CURSOS', 'HABILIDADES'].map((s) => texto.indexOf(s))
  assert.deepEqual(ordem, [...ordem].sort((a, b) => a - b))
  assert.ok(ordem[0] > 0)
  assert.match(texto, /Cuidadora, Atendimento particular\n2022 a 2024\nOrganizava/)
})

test('texto simples omite seção vazia', () => {
  const texto = comoTexto(montar({ nome: 'Ana', telefone: '21999998888' }))
  assert.equal(texto, 'Ana\n(21) 99999-8888')
})

test('texto simples de currículo vazio é vazio', () => {
  assert.equal(comoTexto(montar({})), '')
})
