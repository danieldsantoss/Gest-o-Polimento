const $ = sel => document.querySelector(sel);
const $$ = sel => document.querySelectorAll(sel);

const brMoney = v => Number(v).toFixed(2).replace('.', ',');
const formatDate = d => new Date(d).toLocaleDateString('pt-BR');

let servicos = JSON.parse(localStorage.getItem('servicos') || '[]');
let despesas = JSON.parse(localStorage.getItem('despesas') || '[]');

function salvarLocalStorage() {
  localStorage.setItem('servicos', JSON.stringify(servicos));
  localStorage.setItem('despesas', JSON.stringify(despesas));
}

window.addEventListener('DOMContentLoaded', () => {
  $('#data').valueAsDate = new Date();
  $('#data-dia').valueAsDate = new Date();
  $('#data-semana').valueAsDate = new Date();
  $('#data-despesa').valueAsDate = new Date();
  const ym = new Date(); $('#data-mes').value = ym.toISOString().slice(0, 7);

  $('#btn-cadastro').addEventListener('click', () => show('cadastro'));
  $('#btn-despesas').addEventListener('click', () => show('despesas'));
  $('#btn-relatorio').addEventListener('click', () => { show('relatorio'); aplicarFiltro(); });
  $('#btn-config').addEventListener('click', () => show('config'));

  $('#form-servico').addEventListener('submit', onSubmitServico);
  $('#form-despesa').addEventListener('submit', onSubmitDespesa);

  $('#btn-aplicar-filtro').addEventListener('click', aplicarFiltro);
  $('#tipo-filtro').addEventListener('change', updateFilterVisibility);
  updateFilterVisibility();

  $('#btn-exportar').addEventListener('click', exportarDados);
  $('#btn-importar').addEventListener('click', () => $('#arquivo-importacao').click());
  $('#arquivo-importacao').addEventListener('change', importarDados);

  atualizarListaServicos();
  atualizarListaDespesas();
  aplicarFiltro();
});

function show(t) {
  $$('#tela-cadastro, #tela-relatorio, #tela-config, #tela-despesas').forEach(el => el.classList.remove('ativa'));
  $(`#tela-${t}`).classList.add('ativa');
  $$('#btn-cadastro, #btn-relatorio, #btn-config, #btn-despesas').forEach(el => el.classList.remove('active'));
  $(`#btn-${t}`).classList.add('active');
}

function onSubmitServico(e) {
  e.preventDefault();
  const cliente = $('#cliente').value.trim();
  const carro = $('#carro').value.trim();
  const servico = $('#servico').value.trim();
  const valor = parseFloat($('#valor').value);
  const data = $('#data').value;

  if (!cliente || !carro || !servico || isNaN(valor) || !data) {
    alert('Preencha todos os campos corretamente.');
    return;
  }

  const novo = { id: Date.now(), cliente, carro, servico, valor, data };
  servicos.push(novo);
  salvarLocalStorage();
  $('#form-servico').reset();
  $('#data').valueAsDate = new Date();
  atualizarListaServicos();
  aplicarFiltro();
  show('relatorio');
}

function onSubmitDespesa(e) {
  e.preventDefault();
  const descricao = $('#descricao').value.trim();
  const valor = parseFloat($('#valor-despesa').value);
  const data = $('#data-despesa').value;

  if (!descricao || isNaN(valor) || !data) {
    alert('Preencha todos os campos corretamente.');
    return;
  }

  const nova = { id: Date.now(), descricao, valor, data };
  despesas.push(nova);
  salvarLocalStorage();
  $('#form-despesa').reset();
  $('#data-despesa').valueAsDate = new Date();
  atualizarListaDespesas();
  aplicarFiltro();
  show('despesas');
}

function atualizarListaServicos() {
  const ul = $('#lista-servicos');
  ul.innerHTML = '';
  if (!servicos.length) {
    ul.innerHTML = '<li class="muted">Nenhum serviço cadastrado ainda.</li>';
    return;
  }

  servicos.slice(0).reverse().forEach(s => {
    const li = document.createElement('li');
    li.innerHTML = `
      ${formatDate(s.data)} — ${s.cliente} (${s.carro}) • ${s.servico} • R$ ${brMoney(s.valor)}
      <span class="acoes">
        <button class="btn-outline btn-editar" data-id="${s.id}">Editar</button>
        <button class="btn-danger btn-excluir" data-id="${s.id}">Excluir</button>
      </span>
    `;
    ul.appendChild(li);
  });

  $$('.btn-excluir').forEach(btn => {
    btn.addEventListener('click', e => {
      const id = Number(e.target.dataset.id);
      servicos = servicos.filter(s => s.id !== id);
      salvarLocalStorage();
      atualizarListaServicos();
      aplicarFiltro();
    });
  });

  $$('.btn-editar').forEach(btn => {
    btn.addEventListener('click', e => {
      const id = Number(e.target.dataset.id);
      const s = servicos.find(x => x.id === id);
      if (!s) return;
      $('#cliente').value = s.cliente;
      $('#carro').value = s.carro;
      $('#servico').value = s.servico;
      $('#valor').value = s.valor;
      $('#data').value = s.data;
      show('cadastro');

      $('#form-servico').onsubmit = function (ev) {
        ev.preventDefault();
        s.cliente = $('#cliente').value.trim();
        s.carro = $('#carro').value.trim();
        s.servico = $('#servico').value.trim();
        s.valor = parseFloat($('#valor').value);
        s.data = $('#data').value;
        salvarLocalStorage();
        $('#form-servico').reset();
        $('#form-servico').onsubmit = onSubmitServico;
        atualizarListaServicos();
        aplicarFiltro();
        show('relatorio');
      };
    });
  });
}

function atualizarListaDespesas() {
  const ul = $('#lista-despesas');
  ul.innerHTML = '';
  if (!despesas.length) {
    ul.innerHTML = '<li class="muted">Nenhuma despesa registrada.</li>';
    return;
  }

  despesas.slice(0).reverse().forEach(d => {
    const li = document.createElement('li');
    li.innerHTML = `
      ${formatDate(d.data)} — ${d.descricao} • R$ ${brMoney(d.valor)}
      <span class="acoes">
        <button class="btn-danger btn-excluir-despesa" data-id="${d.id}">Excluir</button>
      </span>
    `;
    ul.appendChild(li);
  });

  $$('.btn-excluir-despesa').forEach(btn => {
    btn.addEventListener('click', e => {
      const id = Number(e.target.dataset.id);
      despesas = despesas.filter(d => d.id !== id);
      salvarLocalStorage();
      atualizarListaDespesas();
      aplicarFiltro();
    });
  });

  const total = despesas.reduce((acc, d) => acc + Number(d.valor || 0), 0);
  $('#total-despesas').textContent = `Total: R$ ${brMoney(total)}`;
}

function updateFilterVisibility() {
  const tipo = $('#tipo-filtro').value;
  $('#filtro-dia').style.display = (tipo === 'dia') ? 'block' : 'none';
  $('#filtro-semana').style.display = (tipo === 'semana') ? 'block' : 'none';
  $('#filtro-mes').style.display = (tipo === 'mes') ? 'block' : 'none';
}

function aplicarFiltro() {
  const tipo = $('#tipo-filtro').value;
  let inicio, fim, label;

  if (tipo === 'dia') {
    const d = $('#data-dia').value ? new Date($('#data-dia').value) : new Date();
    inicio = new Date(d); inicio.setHours(0, 0, 0, 0);
    fim = new Date(d); fim.setHours(23, 59, 59, 999);
    label = formatDate(d);
  } else if (tipo === 'semana') {
    const d = $('#data-semana').value ? new Date($('#data-semana').value) : new Date();
    const day = d.getDay();
    const diff = (day === 0 ? -6 : 1) - day;
    inicio = new Date(d); inicio.setDate(d.getDate() + diff); inicio.setHours(0, 0, 0, 0);
    fim = new Date(inicio); fim.setDate(inicio.getDate() + 6); fim.setHours(23, 59, 59, 999);
    label = `${formatDate(inicio)} a ${formatDate(fim)}`;
  } else {
    const val = $('#data-mes').value || new Date().toISOString().slice(0, 7);
    const d = new Date(val + '-01');
    inicio = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0);
    fim = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
    label = `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  }

  $('#periodo-relatorio').textContent = label;

  const selecionados = servicos.filter(s => {
    const dt = new Date(s.data);
    return dt >= inicio && dt <= fim;
  });

  const totalServicos = selecionados.reduce((acc, s) => acc + Number(s.valor || 0), 0);
  const totalDespesas = despesas.reduce((acc, d) => acc + Number(d.valor || 0), 0);
  const faturamentoLiquido = totalServicos - totalDespesas;

  $('#faturamento-total').textContent = brMoney(faturamentoLiquido);

  const tb = $('#tabela-relatorio tbody');
  tb.innerHTML = '';
  if (!selecionados.length) {
    tb.innerHTML = '<tr><td colspan="5" class="muted center">Nenhum serviço no período.</td></tr>';
  } else {
    selecionados.sort((a, b) => new Date(b.data) - new Date(a.data)).forEach(s => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${formatDate(s.data)}</td>
        <td>${s.cliente}</td>
        <td>${s.carro}</td>
        <td>${s.servico}</td>
        <td>R$ ${brMoney(s.valor)}</td>
      `;
      tb.appendChild(tr);
    });
  }
}

function exportarDados() {
  const blob = new Blob([JSON.stringify({ servicos, despesas }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'dados-oficina.json';
  a.click();
  URL.revokeObjectURL(url);
}

function importarDados(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (ev) {
    try {
      const dados = JSON.parse(ev.target.result);
      if (Array.isArray(dados.servicos) && Array.isArray(dados.despesas)) {
        servicos = dados.servicos;
        despesas = dados.despesas;
        salvarLocalStorage();
        atualizarListaServicos();
        atualizarListaDespesas();
        aplicarFiltro();
        alert('Importação concluída!');
      } else alert('Arquivo inválido.');
    } catch (err) {
      alert('Erro ao importar: ' + err.message);
    }
  };
  reader.readAsText(file);
}
