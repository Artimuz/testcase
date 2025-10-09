"use client"
import { useState, useRef } from "react"
import Papa from "papaparse"
import { withAuth } from "@/contexts/AuthContext"

function AddProductsPage() {
  const [nome, setNome] = useState("")
  const [preco, setPreco] = useState("")
  const [descricao, setDescricao] = useState("")
  const [estoque, setEstoque] = useState("")
  const [urlImagem, setUrlImagem] = useState("")

  const [mensagem, setMensagem] = useState("")
  const [enviando, setEnviando] = useState(false)

  const [modalAberto, setModalAberto] = useState(false)
  const [csvDelimiter, setCsvDelimiter] = useState(",")
  const [csvArquivo, setCsvArquivo] = useState(null)
  const [csvParsing, setCsvParsing] = useState(false)
  const [csvProgressPercent, setCsvProgressPercent] = useState(0)

  const inputFileRef = useRef(null)

  async function handleSubmitFormulario(e) {
    e.preventDefault()
    setMensagem("")
    setEnviando(true)

    const produtoPayload = {
      name: nome.trim(),
      price: Number(String(preco).replace(",", ".")) || 0,
      description: descricao.trim(),
      quantity: Number(estoque),
      urlImagem: urlImagem.trim(),
    }

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(produtoPayload),
      })
      const json = await res.json()

      if (res.ok) {
        setMensagem("Produto cadastrado com sucesso")
        setNome("")
        setPreco("")
        setDescricao("")
        setEstoque("")
        setUrlImagem("")
      } else {
        setMensagem(json.error || "Erro ao cadastrar produto")
      }
    } catch {
      setMensagem("Erro de rede ao cadastrar produto")
    } finally {
      setEnviando(false)
    }
  }

  function abrirModalCSV() {
    setCsvArquivo(null)
    setCsvParsing(false)
    setCsvProgressPercent(0)
    setModalAberto(true)
  }

  function fecharModalCSV() {
    setModalAberto(false)
  }

  function handleArquivoSelecionado(e) {
    const file = e.target.files?.[0] ?? null
    setCsvArquivo(file)
  }

  function baixarCsvTemplate() {
    const header = "Nome,Preço,Descrição,Estoque,URL_Imagem\n"
    const blob = new Blob([header], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "produtos-template.csv"
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  function handleEscolherDelimiterVirgula() {
    setCsvDelimiter(",")
  }

  function handleEscolherDelimiterPontoVirgula() {
    setCsvDelimiter(";")
  }

  function abrirSeletorArquivo() {
    inputFileRef.current?.click()
  }

  function validarLinhaCsv(linha) {
    if (!linha.Nome) return false
    if (!linha.Preço && linha.Preço !== 0) return false
    if (!linha.Estoque && linha.Estoque !== 0) return false
    return true
  }

  async function enviarArrayProdutosParaApi(produtosArray) {
    setCsvParsing(false)
    setCsvProgressPercent(100)
    setEnviando(true)
    try {
      const res = await fetch("/api/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products: produtosArray }),
      })
      const json = await res.json()
      if (res.ok) {
        setMensagem(`Upload concluído: ${json.insertedCount ?? produtosArray.length} produtos adicionados com sucesso!`)
        setModalAberto(false)
      } else {
        setMensagem(json.error || "Erro ao importar CSV")
      }
    } catch {
      setMensagem("Erro de rede no upload CSV")
    } finally {
      setEnviando(false)
    }
  }

  function handleParseCsvAndUpload() {
    if (!csvArquivo) {
      setMensagem("Selecione um arquivo CSV antes de enviar")
      return
    }

    setCsvParsing(true)
    setCsvProgressPercent(0)
    setMensagem("Iniciando leitura do CSV")

    const produtosParsed = []
    let linhasTotais = 0

    Papa.parse(csvArquivo, {
      header: false,
      encoding: "ISO-8859-1",
      delimiter: csvDelimiter,
      skipEmptyLines: true,
      dynamicTyping: true,
      worker: true,

      step: function (results) {
        const row = results.data


        if (!row || row.length < 5) return

        const produto = {
          name: String(row[0]).trim(),
          price: Number(String(row[1]).replace(",", ".")) || 0,
          description: String(row[2]).trim(),
          quantity: Number(row[3]) || 0,
          imageUrl: String(row[4]).trim(),
        }

        produtosParsed.push(produto)
        linhasTotais++

        if (linhasTotais % 50 === 0) {
          setCsvProgressPercent(Math.min(95, Math.round((linhasTotais / (linhasTotais + 100)) * 100)))
        }
      },

      complete: function () {
        setCsvParsing(false)
        if (produtosParsed.length === 0) {
          setMensagem("Nenhuma linha válida encontrada no CSV")
          return
        }
        enviarArrayProdutosParaApi(produtosParsed)
      },

      error: function () {
        setCsvParsing(false)
        setMensagem("Erro ao analisar CSV")
      },
    })
  }

  return (
    <div className="page-container">
      <div className="fade-in">
        <div className="mb-6">
          <h1 className="heading-1">Adicionar produtos</h1>
          <p className="text-body">Adicione produtos individuais ou faça upload em massa via arquivo CSV</p>
        </div>

        {mensagem && (
          <div className={mensagem.includes("sucesso") ? "success-message" : "error-message"}>
            {mensagem}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Individual Product Form */}
          <div className="card">
            <div className="card__header">
              <h2 className="card__title">Adicionar Produto Individual</h2>
            </div>
            <div className="card__content">
              <form onSubmit={handleSubmitFormulario} className="space-y-6">
                <div className="form__field">
                  <label htmlFor="nome" className="form__label">Nome do Produto</label>
                  <input
                    id="nome"
                    className="form__input"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Insira o nome do produto"
                    required
                  />
                </div>

                <div className="form__field">
                  <label htmlFor="preco" className="form__label">Price (BRL)</label>
                  <input
                    id="preco"
                    className="form__input"
                    value={preco}
                    onChange={(e) => setPreco(e.target.value)}
                    placeholder="0.00"
                    inputMode="numeric"
                    required
                  />
                </div>

                <div className="form__field">
                  <label htmlFor="descricao" className="form__label">Descrição</label>
                  <textarea
                    id="descricao"
                    className="form__input form__textarea"
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    placeholder="Descreva seu produto..."
                    rows={4}
                  />
                </div>

                <div className="form__field">
                  <label htmlFor="estoque" className="form__label">Quantidade em Estoque</label>
                  <input
                    id="estoque"
                    className="form__input"
                    value={estoque}
                    onChange={(e) => setEstoque(e.target.value)}
                    placeholder="0"
                    inputMode="numeric"
                    required
                  />
                </div>

                <div className="form__field">
                  <label htmlFor="urlImagem" className="form__label">URL da Imagem</label>
                  <input
                    id="urlImagem"
                    className="form__input"
                    value={urlImagem}
                    onChange={(e) => setUrlImagem(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <button
                  className="btn btn--primary btn--large"
                  type="submit"
                  disabled={enviando}
                  style={{ width: "100%" }}
                >
                  {enviando ? "Adicionando Produtos..." : "Adicionar Produto"}
                </button>
              </form>
            </div>
          </div>

          {/* CSV Upload Section */}
          <div className="card">
            <div className="card__header">
              <h2 className="card__title">Upload em Massa via CSV</h2>
            </div>
            <div className="card__content">
              <div className="text-center space-y-6">
                <div className="space-y-4">
                  <p className="text-body">
                    Faça upload de vários produtos de uma só vez usando um arquivo CSV.
                  </p>
                  
                  <div className="text-small">
                    <p><strong>Formato CSV necessário:</strong></p>
                    <code style={{ 
                      fontSize: "0.75rem", 
                      background: "var(--bg-tertiary)", 
                      padding: "var(--space-sm)", 
                      borderRadius: "var(--radius-sm)", 
                      display: "block", 
                      marginTop: "var(--space-sm)" 
                    }}>
                      Nome,Preço,Descrição,Estoque,URL_Imagem
                    </code>
                  </div>
                </div>

                <div className="space-y-4">
                  <button
                    type="button"
                    className="btn btn--secondary btn--large"
                    onClick={baixarCsvTemplate}
                    style={{ width: "100%" }}
                  >
                    📥 Download Modelo CSV
                  </button>

                  <button
                    type="button"
                    className="btn btn--primary btn--large"
                    onClick={abrirModalCSV}
                    style={{ width: "100%" }}
                  >
                    📤 Upload de Arquivo CSV
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CSV Upload Modal */}
        {modalAberto && (
          <div className="modal-overlay" onClick={fecharModalCSV}>
            <div className="modal modal--medium" onClick={(e) => e.stopPropagation()}>
                {mensagem && (
                  <div className={mensagem.includes("sucesso") ? "success-message" : "error-message"}>
                    {mensagem}
                  </div>
                )}
              <div className="modal__header">
                <h3 className="modal__title">Importar produtos via CSV</h3>
                <button onClick={fecharModalCSV} className="modal__close">
                  ✕
                </button>
              </div>

              <div className="modal__content">
                <div className="space-y-6">
                  <div>
                    <p className="text-body">
                      O arquivo CSV deve ter o cabeçalho: <strong>Nome,Preço,Descrição,Estoque,URL_Imagem</strong>
                    </p>
                  </div>

                  <div>
                    <h4 className="heading-4">Configurações de Delimitador</h4>
                    <div className="flex gap-md">
                      <label className="flex items-center gap-sm cursor-pointer">
                        <input 
                          type="radio" 
                          checked={csvDelimiter === ","} 
                          onChange={handleEscolherDelimiterVirgula} 
                          className="form-radio"
                        />
                        <span className="text-body">Usa vírgula (,)</span>
                      </label>
                      <label className="flex items-center gap-sm cursor-pointer">
                        <input 
                          type="radio" 
                          checked={csvDelimiter === ";"} 
                          onChange={handleEscolherDelimiterPontoVirgula} 
                          className="form-radio"
                        />
                        <span className="text-body">Usa ponto e vírgula (;)</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-md">
                    <button 
                      className="btn btn--secondary flex-1" 
                      onClick={baixarCsvTemplate}
                    >
                      📥 Download Modelo
                    </button>
                    <button 
                      className="btn btn--primary flex-1" 
                      onClick={abrirSeletorArquivo}
                    >
                      📁 Selecionar Arquivo
                    </button>
                    <input 
                      ref={inputFileRef} 
                      type="file" 
                      accept=".csv,text/csv" 
                      onChange={handleArquivoSelecionado} 
                      style={{ display: "none" }} 
                    />
                  </div>

                  <div className="card">
                    <div className="card__content">
                      {csvArquivo ? (
                        <div className="space-y-2">
                          <p className="text-body"><strong>Arquivo:</strong> {csvArquivo.name}</p>
                          <p className="text-body"><strong>Tamanho:</strong> {(csvArquivo.size / 1024).toFixed(2)} KB</p>
                        </div>
                      ) : (
                        <p className="text-body text-center">Nenhum arquivo selecionado</p>
                      )}
                    </div>
                  </div>

                  {csvParsing && (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-small">Carregando...</span>
                        <span className="text-small">{csvProgressPercent}%</span>
                      </div>
                      <div style={{ 
                        width: "100%", 
                        height: "8px", 
                        background: "var(--bg-tertiary)", 
                        borderRadius: "var(--radius-sm)",
                        overflow: "hidden"
                      }}>
                        <div style={{ 
                          width: `${csvProgressPercent}%`, 
                          height: "100%", 
                          background: "var(--accent-primary)",
                          transition: "width 0.3s ease"
                        }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="modal__footer">
                <button 
                  className="btn btn--secondary" 
                  onClick={fecharModalCSV}
                  disabled={csvParsing}
                >
                  Cancelar
                </button>
                <button 
                  className="btn btn--success" 
                  onClick={handleParseCsvAndUpload} 
                  disabled={csvParsing || !csvArquivo}
                >
                  {csvParsing ? `Processing... ${csvProgressPercent}%` : "Upload CSV"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default withAuth(AddProductsPage, {
  allowedRoles: ["VENDEDOR"],
  requireActive: true
})