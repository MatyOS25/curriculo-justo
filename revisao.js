const semAcento = (texto) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

const termo = (padrao) => new RegExp(`(?<![\\p{L}\\p{N}])(?:${padrao})(?![\\p{L}\\p{N}])`, 'u')

const DADOS_DISPENSAVEIS = [
  {
    codigo: 'dado-idade',
    padrao: termo('[0-9]{2} anos(?! de| em| na| no| como)|data de nascimento|nascid[oa] em|idade:?'),
    mensagem: 'Idade e data de nascimento não precisam estar no currículo.',
  },
  {
    codigo: 'dado-familia',
    padrao: termo('solteir[oa]|casad[oa]|divorciad[oa]|viuv[oa]|estado civil|filh[oa]s?'),
    mensagem: 'Estado civil e filhos não precisam estar no currículo.',
  },
  {
    codigo: 'dado-documento',
    padrao: termo('cpf|rg|cnh [0-9]+'),
    mensagem: 'Número de documento não precisa estar no currículo. Só informe quando a empresa contratar.',
  },
  {
    codigo: 'dado-religiao',
    padrao: termo('evangelic[oa]|catolic[oa]|crista?o?|espirita|umbandista|religiao'),
    mensagem: 'Religião não precisa estar no currículo.',
  },
]

const textosLivres = ({ objetivo, experiencias, formacoes, habilidades }) =>
  semAcento(
    [
      objetivo,
      ...experiencias.flatMap((e) => [e.funcao, e.descricao]),
      ...formacoes.map((f) => f.curso),
      ...habilidades,
    ]
      .filter(Boolean)
      .join(' \n '),
  )

const faltas = ({ objetivo, experiencias, formacoes, habilidades }) => [
  ...(objetivo ? [] : [{ codigo: 'sem-objetivo', mensagem: 'Escreva em uma frase o trabalho que você procura.' }]),
  ...(experiencias.length || formacoes.length
    ? []
    : [{ codigo: 'sem-historico', mensagem: 'Conte uma experiência ou um estudo. Bico, voluntariado e cuidado de pessoas também valem.' }]),
  ...(habilidades.length ? [] : [{ codigo: 'sem-habilidades', mensagem: 'Liste o que você sabe fazer, como atendimento ou organização.' }]),
]

const experienciasCurtas = (experiencias) =>
  experiencias
    .filter((e) => (e.funcao || e.local) && !e.descricao)
    .map((e) => ({
      codigo: 'experiencia-sem-descricao',
      mensagem: `Conte em uma frase o que você fazia em "${e.funcao || e.local}".`,
    }))

// Só revisa depois que a pessoa começou: formulário vazio não precisa de lista de cobranças.
export function revisarCurriculo(modelo) {
  const texto = textosLivres(modelo)
  const comecou = Boolean(modelo.nome || modelo.contatos.length || texto)
  if (!comecou) return []
  return [
    ...faltas(modelo),
    ...experienciasCurtas(modelo.experiencias),
    ...DADOS_DISPENSAVEIS.filter(({ padrao }) => padrao.test(texto)).map(({ codigo, mensagem }) => ({ codigo, mensagem })),
  ]
}

const secao = (titulo, linhas) => (linhas.length ? ['', titulo, ...linhas] : [])

const juntar = (...partes) => partes.filter(Boolean).join(', ')

// Muitos sites de emprego pedem o currículo colado em um campo de texto.
export function comoTexto({ nome, contatos, objetivo, experiencias, formacoes, habilidades }) {
  return [
    ...(nome ? [nome] : []),
    ...(contatos.length ? [contatos.join(' | ')] : []),
    ...secao('OBJETIVO', objetivo ? [objetivo] : []),
    ...secao('EXPERIÊNCIA', experiencias.flatMap((e) => [juntar(e.funcao, e.local), e.periodo, e.descricao].filter(Boolean))),
    ...secao('ESTUDOS E CURSOS', formacoes.flatMap((f) => [juntar(f.curso, f.instituicao), f.periodo].filter(Boolean))),
    ...secao('HABILIDADES', habilidades.length ? [habilidades.join(', ')] : []),
  ].join('\n')
}
