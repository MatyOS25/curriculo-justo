import { test } from 'node:test'
import assert from 'node:assert/strict'
import { validar, montar, formatarTelefone } from './curriculo.js'

const base = { nome: 'Ana Souza', telefone: '21999998888', email: '' }

test('currículo com nome e um contato válido não tem erros', () => {
  assert.deepEqual(validar(base), {})
})

test('nome é obrigatório, mesmo preenchido só com espaços', () => {
  assert.ok(validar({ ...base, nome: '   ' }).nome)
})

test('precisa de pelo menos um contato', () => {
  assert.ok(validar({ nome: 'Ana', telefone: '', email: '' }).telefone)
})

test('e-mail sozinho basta como contato', () => {
  assert.deepEqual(validar({ nome: 'Ana', telefone: '', email: 'ana@exemplo.com' }), {})
})

test('e-mail malformado é apontado mesmo com telefone válido', () => {
  assert.ok(validar({ ...base, email: 'ana@' }).email)
})

test('telefone precisa de 10 ou 11 dígitos', () => {
  assert.ok(validar({ ...base, telefone: '12345' }).telefone)
  assert.deepEqual(validar({ ...base, telefone: '(21) 3333-4444' }), {})
})

test('formata telefone fixo e celular', () => {
  assert.equal(formatarTelefone('21999998888'), '(21) 99999-8888')
  assert.equal(formatarTelefone('(21) 3333-4444'), '(21) 3333-4444')
})

test('telefone fora do padrão fica como foi digitado', () => {
  assert.equal(formatarTelefone('123'), '123')
})

test('montar tira espaços, itens vazios e não altera a entrada', () => {
  const entrada = Object.freeze({
    ...base,
    nome: '  Ana Souza ',
    experiencias: Object.freeze([
      Object.freeze({ funcao: ' Cuidadora ', local: 'Família da vizinhança', periodo: '2023', descricao: '' }),
      Object.freeze({ funcao: ' ', local: '', periodo: '', descricao: '' }),
    ]),
    formacoes: Object.freeze([]),
    habilidades: 'Atendimento,  organização, , Excel',
  })
  const modelo = montar(entrada)
  assert.equal(modelo.nome, 'Ana Souza')
  assert.deepEqual(modelo.experiencias, [
    { funcao: 'Cuidadora', local: 'Família da vizinhança', periodo: '2023', descricao: '' },
  ])
  assert.deepEqual(modelo.habilidades, ['Atendimento', 'organização', 'Excel'])
})

test('montar reúne os contatos preenchidos', () => {
  const modelo = montar({ ...base, cidade: 'Niterói, RJ', email: 'ana@exemplo.com' })
  assert.deepEqual(modelo.contatos, ['(21) 99999-8888', 'ana@exemplo.com', 'Niterói, RJ'])
})

test('montar aceita dados ausentes', () => {
  const modelo = montar({})
  assert.equal(modelo.nome, '')
  assert.deepEqual(modelo.contatos, [])
  assert.deepEqual(modelo.experiencias, [])
  assert.deepEqual(modelo.formacoes, [])
  assert.deepEqual(modelo.habilidades, [])
})

test('montar ignora campos que o currículo não pede', () => {
  const modelo = montar({ ...base, idade: '45', estadoCivil: 'casada', foto: 'x.png' })
  assert.deepEqual(Object.keys(modelo).sort(), ['contatos', 'experiencias', 'formacoes', 'habilidades', 'nome', 'objetivo'])
})
