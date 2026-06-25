// ─── Cores para as seguradoras ────────────────────────────────────────────────
const CORES = [
    '#1f77b4','#ff7f0e','#2ca02c','#d62728','#9467bd',
    '#8c564b','#e377c2','#7f7f7f','#bcbd22','#17becf'
];

let graficoAtual = null;
let contadorSeg = 0;

// ─── Utilitários de moeda ─────────────────────────────────────────────────────

function formatarMoeda(valor) {
    if (isNaN(valor) || valor === null) return 'R$ 0,00';
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function parseMoeda(str) {
    if (!str || str.trim() === '') return 0;
    let s = str.replace(/\s/g, '').replace('R$', '').trim();
    if (s.includes('.') && s.includes(',')) {
        // Padrão BR completo: 1.522,33
        s = s.replace(/\./g, '').replace(',', '.');
    } else if (s.includes(',') && !s.includes('.')) {
        // BR sem milhar: 1522,33
        s = s.replace(',', '.');
    } else if (s.includes('.') && !s.includes(',')) {
        const partes = s.split('.');
        if (partes[partes.length - 1].length === 3) {
            // Ponto como separador de milhar: 1.522
            s = s.replace(/\./g, '');
        }
        // Senão é decimal: 1522.33 → mantém
    }
    const num = parseFloat(s);
    return isNaN(num) ? 0 : num;
}

function mascaraMoeda(input) {
    let val = input.value.replace(/\D/g, '');
    if (val === '') { input.value = ''; return; }
    let num = parseInt(val, 10) / 100;
    input.value = num.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// ─── Seguradoras ──────────────────────────────────────────────────────────────

function adicionarSeguradora() {
    const container = document.getElementById('seguradoras');
    const id = contadorSeg++;
    const cor = CORES[id % CORES.length];

    const div = document.createElement('div');
    div.className = 'seg';
    div.dataset.id = id;
    div.innerHTML = `
        <div class="seg-header">
            <span class="seg-titulo" style="color:${cor};">● Seguradora ${id + 1}</span>
            <button class="btn-remover" onclick="removerSeguradora(this)" title="Remover">✕</button>
        </div>
        <input class="seg-nome"  placeholder="Nome da seguradora" />
        <input class="seg-atend" placeholder="Atendimentos" type="number" min="0" />
        <input class="seg-tmc"   placeholder="TMC individual (ex: 38 min)" />
        <input class="seg-fat"   placeholder="Faturado (ex: 1.522,33)" oninput="mascaraMoeda(this)" />
    `;
    container.appendChild(div);
}

function removerSeguradora(btn) {
    btn.closest('.seg').remove();
}

// ─── Colaboradores em Destaque ────────────────────────────────────────────────

function adicionarPrestador() {
    const container = document.getElementById('prestadoresContainer');
    const div = document.createElement('div');
    div.className = 'prestador-item';
    div.innerHTML = `
        <input placeholder="Nome do colaborador" />
        <button onclick="this.parentElement.remove()">✕</button>
    `;
    container.appendChild(div);
}

// ─── Formatação de data ───────────────────────────────────────────────────────

function formatarData(str) {
    if (!str) return '';
    const d = new Date(str);
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const ano = d.getFullYear();
    const h   = String(d.getHours()).padStart(2, '0');
    const m   = String(d.getMinutes()).padStart(2, '0');
    return `${dia}/${mes}/${ano} ${h}h${m}`;
}

// ─── Coletar dados das seguradoras ───────────────────────────────────────────

function coletarSeguradoras() {
    const segs = document.querySelectorAll('.seg');
    const dados = [];
    segs.forEach((seg, i) => {
        const nome   = seg.querySelector('.seg-nome').value.trim() || `Seguradora ${i + 1}`;
        const atend  = parseInt(seg.querySelector('.seg-atend').value) || 0;
        const tmc    = seg.querySelector('.seg-tmc').value.trim();
        const fatStr = seg.querySelector('.seg-fat').value;
        const fat    = parseMoeda(fatStr);
        dados.push({ nome, atend, tmc, fat, cor: CORES[i % CORES.length] });
    });
    return dados;
}

// ─── Gerar Relatório ──────────────────────────────────────────────────────────

function gerarRelatorio() {
    const responsavel   = document.getElementById('responsavel').value.trim();
    const inicio        = document.getElementById('inicio').value;
    const fim           = document.getElementById('fim').value;
    const tmc           = document.getElementById('tmc').value.trim();
    const justificativa = document.getElementById('justificativa').value.trim();
    const pendencias    = document.getElementById('pendencias').value.trim();

    const segs = coletarSeguradoras();

    const totalAtend = segs.reduce((s, x) => s + x.atend, 0);
    const totalFat   = segs.reduce((s, x) => s + x.fat,   0);

    let periodo = '-';
    if (inicio && fim) periodo = `${formatarData(inicio)} até ${formatarData(fim)}`;
    else if (inicio)   periodo = `A partir de ${formatarData(inicio)}`;
    else if (fim)      periodo = `Até ${formatarData(fim)}`;

    document.getElementById('rPeriodo').textContent     = periodo;
    document.getElementById('rResponsavel').textContent = responsavel || '-';
    document.getElementById('rTmc').textContent         = tmc || '-';
    document.getElementById('rServicos').textContent    = String(totalAtend).padStart(2, '0');
    document.getElementById('rFaturado').textContent    = formatarMoeda(totalFat);
    document.getElementById('rTotalEixoX').textContent  = String(totalAtend).padStart(2, '0');

    renderizarGrafico(segs, totalAtend);
    renderizarTabela(segs);

    const prestInputs = document.querySelectorAll('#prestadoresContainer .prestador-item input');
    const prestNomes  = Array.from(prestInputs).map(i => i.value.trim()).filter(Boolean);
    document.getElementById('rPrestadoresLista').innerHTML = prestNomes.length
        ? prestNomes.map(n => `<div>⭐ ${n}</div>`).join('')
        : '-';

    document.getElementById('rJustificativa').textContent = justificativa || '-';
    document.getElementById('rPendencias').textContent    = pendencias    || '-';
}

// ─── Gráfico ──────────────────────────────────────────────────────────────────

function renderizarGrafico(segs, totalAtend) {

segs = [...segs].sort((a, b) => b.atend - a.atend);

    const ctx = document.getElementById('grafico').getContext('2d');
    if (graficoAtual) graficoAtual.destroy();

    const labels  = segs.map(s => s.nome.toUpperCase());
    const valores  = segs.map(s => s.atend);
    const cores    = segs.map(s => s.cor);
    const pcts     = segs.map(s =>
        totalAtend > 0 ? ((s.atend / totalAtend) * 100).toFixed(1) : '0.0'
    );

    graficoAtual = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                data: valores,
                backgroundColor: cores,
                borderRadius: 4,
                borderSkipped: false,
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (ctx) => ` ${ctx.raw} atendimentos`
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    grid: { color: '#e8edf5' },
                    ticks: { stepSize: 1, color: '#555' }
                },
                y: {
                    grid: { display: false },
                    ticks: { color: '#333', font: { weight: 'bold' } }
                }
            },
            layout: { padding: { right: 80 } },
            animation: {
                onComplete: function () {
                    const chart = this;
                    const { ctx: c, scales } = chart;
                    c.font = 'bold 12px Arial';
                    c.fillStyle = '#0a2d72';
                    c.textAlign = 'left';
                    c.textBaseline = 'middle';
                    chart.data.datasets[0].data.forEach((val, i) => {
                        const meta = chart.getDatasetMeta(0);
                        const bar  = meta.data[i];
                        const x    = scales.x.getPixelForValue(val) + 6;
                        const y    = bar.y;
                        c.fillText(`${val} (${pcts[i]}%)`, x, y);
                    });
                }
            }
        }
    });
}

// ─── Tabela ───────────────────────────────────────────────────────────────────

function renderizarTabela(segs) {
segs = [...segs].sort((a, b) => b.atend - a.atend);
    const tbody = document.getElementById('tbodyClientes');
    tbody.innerHTML = '';

    segs.forEach(seg => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <div class="td-nome">
                    <span class="indicador-cor" style="background:${seg.cor};"></span>
                    ${seg.nome.toUpperCase()}
                </div>
            </td>
            <td>${String(seg.atend).padStart(2, '0')}</td>
            <td class="td-tmc">${seg.tmc || '-'}</td>
            <td class="td-faturado">${formatarMoeda(seg.fat)}</td>
        `;
        tbody.appendChild(tr);
    });
}

// ─── Baixar PNG ───────────────────────────────────────────────────────────────

function baixarPNG() {
    const el = document.getElementById('relatorio');
    html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
    }).then(canvas => {
        const link = document.createElement('a');
        link.download = 'relatorio-brasil-guinchos.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    });
}

// ─── Inicializar ──────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    adicionarSeguradora();
});
