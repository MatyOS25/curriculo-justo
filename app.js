import { validar, montar } from './curriculo.js'

const CHAVE = 'curriculo-justo'
const LISTAS = ['experiencias', 'formacoes']
const ROTULOS = { experiencias: 'Experiência', formacoes: 'Estudo' }
const CAMPOS_SIMPLES = ['nome', 'telefone', 'email', 'cidade', 'objetivo', 'habilidades']

const formulario = document.querySelector('#formulario')
const folha = document.querySelector('#folha')
const guardar = document.querySelector('#guardar')
const avisoGuardar = document.querySelector('#aviso-guardar')

const elemento = (tag, texto, classe) => Object.assign(document.createElement(tag), { textContent: texto, className: classe ?? '' })
const juntar = (...partes) => partes.filter(Boolean).join(', ')

const numerarItens = (lista) => {
  const rotulo = ROTULOS[lista]
  document.querySelectorAll(`#${lista} .item`).forEach((item, indice) => {
    item.setAttribute('aria-label', `${rotulo} ${indice + 1}`)
    item.querySelector('.remover').setAttribute('aria-label', `Remover ${rotulo.toLowerCase()} ${indice + 1}`)
  })
}

const adicionarItem = (lista, valores = {}) => {
  const copia = document.querySelector(`#modelo-${lista}`).content.cloneNode(true)
  copia.querySelectorAll('[data-campo]').forEach((campo) => {
    campo.value = valores[campo.dataset.campo] ?? ''
  })
  const item = copia.querySelector('.item')
  document.querySelector(`#${lista}`).append(copia)
  numerarItens(lista)
  return item
}

const lerItens = (lista) =>
  [...document.querySelectorAll(`#${lista} .item`)].map((item) =>
    Object.fromEntries([...item.querySelectorAll('[data-campo]')].map((campo) => [campo.dataset.campo, campo.value])),
  )

const lerDados = () => ({
  ...Object.fromEntries(CAMPOS_SIMPLES.map((nome) => [nome, formulario.elements[nome].value])),
  ...Object.fromEntries(LISTAS.map((lista) => [lista, lerItens(lista)])),
})

const secao = (titulo, ...conteudo) => {
  const bloco = document.createElement('section')
  bloco.append(elemento('h3', titulo), ...conteudo)
  return bloco
}

const titulo = (...partes) => (juntar(...partes) ? [elemento('h4', juntar(...partes))] : [])

const blocoExperiencia = ({ funcao, local, periodo, descricao }) => [
  ...titulo(funcao, local),
  ...(periodo ? [elemento('p', periodo)] : []),
  ...(descricao ? [elemento('p', descricao)] : []),
]

const blocoFormacao = ({ curso, instituicao, periodo }) => [
  ...titulo(curso, instituicao),
  ...(periodo ? [elemento('p', periodo)] : []),
]

const desenhar = () => {
  const { nome, contatos, objetivo, experiencias, formacoes, habilidades } = montar(lerDados())
  folha.replaceChildren(
    elemento('h2', nome || 'Seu nome aparece aqui', nome ? '' : 'vazio'),
    ...(contatos.length ? [elemento('p', contatos.join(' | '), 'contatos')] : []),
    ...(objetivo ? [secao('Objetivo', elemento('p', objetivo))] : []),
    ...(experiencias.length ? [secao('Experiência', ...experiencias.flatMap(blocoExperiencia))] : []),
    ...(formacoes.length ? [secao('Estudos e cursos', ...formacoes.flatMap(blocoFormacao))] : []),
    ...(habilidades.length ? [secao('Habilidades', elemento('p', habilidades.join(', ')))] : []),
  )
}

const armazenamento = {
  ler: () => {
    try {
      return JSON.parse(localStorage.getItem(CHAVE))
    } catch {
      return null
    }
  },
  gravar: (dados) => {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(dados))
      return true
    } catch {
      return false
    }
  },
  apagar: () => {
    try {
      localStorage.removeItem(CHAVE)
    } catch {
      // Sem acesso ao armazenamento, não há nada guardado para apagar.
    }
  },
}

const sincronizarArmazenamento = () => {
  if (!guardar.checked) return armazenamento.apagar()
  const gravou = armazenamento.gravar(lerDados())
  guardar.checked = gravou
  avisoGuardar.textContent = gravou ? '' : 'Não foi possível guardar neste aparelho. Salve o PDF antes de sair da página.'
}

const mostrarErros = (erros) => {
  ;['nome', 'telefone', 'email'].forEach((campo) => {
    const aviso = document.querySelector(`#erro-${campo}`)
    aviso.textContent = erros[campo] ?? ''
    aviso.hidden = !erros[campo]
    formulario.elements[campo].setAttribute('aria-invalid', String(Boolean(erros[campo])))
  })
  const primeiro = ['nome', 'telefone', 'email'].find((campo) => erros[campo])
  if (primeiro) formulario.elements[primeiro].focus()
}

const atualizar = () => {
  desenhar()
  sincronizarArmazenamento()
}

const preencher = (dados) => {
  CAMPOS_SIMPLES.forEach((nome) => {
    formulario.elements[nome].value = typeof dados[nome] === 'string' ? dados[nome] : ''
  })
  LISTAS.forEach((lista) => {
    const itens = Array.isArray(dados[lista]) ? dados[lista] : []
    itens.filter((item) => item && typeof item === 'object').forEach((item) => adicionarItem(lista, item))
  })
}

formulario.addEventListener('input', atualizar)

formulario.addEventListener('click', ({ target }) => {
  if (target.dataset.adicionar) {
    adicionarItem(target.dataset.adicionar).querySelector('[data-campo]').focus()
  }
  if (target.classList.contains('remover')) {
    const adicionar = target.closest('fieldset').querySelector('button[data-adicionar]')
    target.closest('.item').remove()
    numerarItens(adicionar.dataset.adicionar)
    adicionar.focus()
    atualizar()
  }
})

// Enter em um campo não deve abrir a impressão enquanto a pessoa ainda preenche.
formulario.addEventListener('keydown', (evento) => {
  if (evento.key === 'Enter' && evento.target.matches('input')) evento.preventDefault()
})

document.querySelector('#apagar').addEventListener('click', () => {
  if (!window.confirm('Apagar todos os dados deste currículo? Essa ação não pode ser desfeita.')) return
  formulario.reset()
  LISTAS.forEach((lista) => document.querySelector(`#${lista}`).replaceChildren())
  guardar.checked = false
  avisoGuardar.textContent = ''
  armazenamento.apagar()
  mostrarErros({})
  desenhar()
  formulario.elements.nome.focus()
})

formulario.addEventListener('submit', (evento) => {
  evento.preventDefault()
  const erros = validar(lerDados())
  mostrarErros(erros)
  if (Object.keys(erros).length === 0) window.print()
})

const salvo = armazenamento.ler()
if (salvo && typeof salvo === 'object') {
  preencher(salvo)
  guardar.checked = true
}
desenhar()
