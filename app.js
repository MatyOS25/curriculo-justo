import { validar, montar, mascararTelefone, posicaoNaMascara } from './curriculo.js'

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

const titulo = (...partes) => {
  const texto = juntar(...partes)
  return texto ? [elemento('h4', texto)] : []
}

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

const CAMPOS_COM_ERRO = ['nome', 'telefone', 'email']

const pintarErros = (erros) => {
  CAMPOS_COM_ERRO.forEach((campo) => {
    const aviso = document.querySelector(`#erro-${campo}`)
    aviso.textContent = erros[campo] ?? ''
    aviso.hidden = !erros[campo]
    formulario.elements[campo].setAttribute('aria-invalid', String(Boolean(erros[campo])))
  })
}

const mostrarErros = (erros) => {
  pintarErros(erros)
  const primeiro = CAMPOS_COM_ERRO.find((campo) => erros[campo])
  if (primeiro) formulario.elements[primeiro].focus()
}

// Depois da primeira validação, o erro some assim que a pessoa corrige o campo.
const revisarErros = () => {
  if (CAMPOS_COM_ERRO.some((campo) => !document.querySelector(`#erro-${campo}`).hidden)) {
    pintarErros(validar(lerDados()))
  }
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

formulario.addEventListener('input', (evento) => {
  if (evento.target.name === 'telefone') {
    const campo = evento.target
    const aEsquerda = campo.value.slice(0, campo.selectionStart).replace(/[^0-9]/g, '').length
    campo.value = mascararTelefone(campo.value)
    const cursor = posicaoNaMascara(campo.value, aEsquerda)
    campo.setSelectionRange(cursor, cursor)
  }
  atualizar()
  revisarErros()
})

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

const CAMPOS_CONHECIDOS = [...CAMPOS_SIMPLES, ...LISTAS]

document.querySelector('#baixar').addEventListener('click', () => {
  const dados = JSON.stringify(lerDados(), null, 2)
  const url = URL.createObjectURL(new Blob([dados], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = 'curriculo.json'
  link.click()
  URL.revokeObjectURL(url)
})

document.querySelector('#arquivo').addEventListener('change', async ({ target }) => {
  const [item] = target.files
  target.value = ''
  if (!item) return
  try {
    const dados = JSON.parse(await item.text())
    if (!dados || typeof dados !== 'object' || !CAMPOS_CONHECIDOS.some((campo) => campo in dados)) throw new Error()
    formulario.reset()
    LISTAS.forEach((lista) => document.querySelector(`#${lista}`).replaceChildren())
    preencher(dados)
    atualizar()
    revisarErros()
  } catch {
    avisoGuardar.textContent = 'Não foi possível abrir o arquivo. Ele precisa ter sido guardado pelo Currículo Justo.'
    setTimeout(() => {
      avisoGuardar.textContent = ''
    }, 5000)
  }
})

const salvo = armazenamento.ler()
if (salvo && typeof salvo === 'object') {
  preencher(salvo)
  guardar.checked = true
}
desenhar()

// Depois da primeira visita, o aplicativo passa a abrir mesmo sem internet.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js')
}
