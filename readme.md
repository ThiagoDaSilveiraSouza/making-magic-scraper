# 🧙‍♂️ Making Magic Scraper

Este projeto é um crawler desenvolvido em Node.js utilizando Playwright para coletar artigos da página:

[https://magic.wizards.com/en/news/making-magic](https://magic.wizards.com/en/news/making-magic)

---

# 🚀 Funcionalidades

* 🔎 Coleta automática de todos os links paginados
* 📊 Barra de progresso durante coleta e processamento
* 💾 Cache de links (evita reprocessamento desnecessário)
* ♻️ Modo de continuação (skip de arquivos já baixados)
* 📄 Exportação em HTML ou PDF
* 🧠 Detecção automática do fim da paginação
* ⚡ Processamento paralelo para maior velocidade

---

# 📦 Instalação

### 1. Clone o projeto

```bash
git clone <seu-repo>
cd <seu-projeto>
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Instale o Playwright (caso necessário)

```bash
npx playwright install
```

---

# ▶️ Como usar

Execute o script:

```bash
node src/scraper.js
```

---

# 🧭 Fluxo de execução

Ao rodar o projeto, você verá interações no terminal:

### 1. Uso de cache

```text
📦 Usar cache? (y/n)
```

* `y` → usa links já coletados (links.json)
* `n` → faz nova coleta completa

---

### 2. Escolha do formato

```text
Formato (1=HTML, 2=PDF)
```

* `1` → salva páginas completas em HTML
* `2` → salva apenas o conteúdo do artigo em PDF

---

### 3. Controle de arquivos existentes

```text
📁 Pular existentes? (y/n)
```

* `y` → continua de onde parou
* `n` → reprocessa tudo

---

# 📁 Estrutura do projeto

```text
projeto/
 ├── src/
 │    └── scraper.js
 ├── output/         # arquivos gerados
 ├── links.json      # cache de links
 ├── package.json
 └── README.md
```

---

# 📊 Como funciona internamente

## 🔎 Coleta de links

* Navega por todas as páginas
* Detecta automaticamente o fim da paginação
* Remove links duplicados

## 📦 Processamento

* Abre múltiplas páginas em paralelo
* Salva arquivos conforme formato escolhido

## 📈 Progresso

* Barra de progresso para coleta (estimada)
* Barra de progresso para processamento (real)

---

# ⚡ Performance

O projeto utiliza:

* Paralelismo de páginas
* Reaproveitamento de contexto do browser
* Controle de concorrência

Você pode ajustar:

```js
const CONCURRENCY = 5;
const PAGE_CONCURRENCY = 3;
```

---

# ⚠️ Observações importantes

* O site pode alterar estrutura HTML → pode quebrar seletores
* PDF salva apenas o conteúdo do artigo (não a página inteira)
* Evite aumentar muito a concorrência para não ser bloqueado

---

# 🧪 Possíveis melhorias futuras

* Retry automático de falhas
* Fila persistente
* Extração de conteúdo limpo (texto)
* CLI com comandos (`scrape`, `resume`, etc.)
* Deploy em servidor (cron job)

---

# 🏁 Conclusão

Este projeto já se comporta como uma ferramenta de scraping profissional, com:

* Controle de execução
* Performance otimizada
* Experiência de uso via CLI

---

# 🤝 Contribuição

Sinta-se livre para adaptar e evoluir o projeto conforme sua necessidade.

---

# 📄 Licença

Uso livre para fins educacionais e pessoais.
