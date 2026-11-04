const EMAIL = /^[^@\s]+@[^@\s]+[.][^@\s]+$/

const limpar = (valor) => (valor ?? '').trim()
const digitos = (valor) => limpar(valor).replace(/[^0-9]/g, '')

export function formatarTelefone(telefone) {
  const numero = digitos(telefone)
  if (numero.length < 10 || numero.length > 11) return limpar(telefone)
  const corte = numero.length - 4
  return `(${numero.slice(0, 2)}) ${numero.slice(2, corte)}-${numero.slice(corte)}`
}

export function validar({ nome, telefone, email }) {
  const quantidade = digitos(telefone).length
  return {
    ...(limpar(nome) ? {} : { nome: 'Digite o nome que deve aparecer no currículo.' }),
    ...(!limpar(telefone) && !limpar(email)
      ? { telefone: 'Informe um telefone ou um e-mail para receber o contato.' }
      : {}),
    ...(limpar(telefone) && (quantidade < 10 || quantidade > 11)
      ? { telefone: 'Digite o telefone com DDD, por exemplo (21) 99999-8888.' }
      : {}),
    ...(limpar(email) && !EMAIL.test(limpar(email))
      ? { email: 'Digite o e-mail completo, por exemplo nome@exemplo.com.' }
      : {}),
  }
}

const limparItens = (itens = []) =>
  itens
    .map((item) => Object.fromEntries(Object.entries(item).map(([campo, valor]) => [campo, limpar(valor)])))
    .filter((item) => Object.values(item).some(Boolean))

export function montar({ nome, telefone, email, cidade, objetivo, experiencias, formacoes, habilidades }) {
  return {
    nome: limpar(nome),
    contatos: [formatarTelefone(telefone), limpar(email), limpar(cidade)].filter(Boolean),
    objetivo: limpar(objetivo),
    experiencias: limparItens(experiencias),
    formacoes: limparItens(formacoes),
    habilidades: (habilidades ?? '').split(',').map(limpar).filter(Boolean),
  }
}
