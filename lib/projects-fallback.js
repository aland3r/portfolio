import { localizeProject } from './gestalt-auth/projects.js'

/** Offline / build-time fallback when Supabase is unavailable. Live SoT: portfolio.projects */
export const FALLBACK_ROWS = [
  {
    code: 'deviante',
    product_code: 'deviante',
    title: 'Deviante: decision support for industrial maintenance',
    title_pt: 'Deviante: suporte à decisão em manutenção industrial',
    summary:
      'From PIBITI research to a working DSS: process mining, IPDD/ADWIN drift detection, and OOUX — so maintenance managers can act on early degradation, not after the line stops.',
    summary_pt:
      'Da pesquisa PIBITI a um DSS no ar: mineração de processos, detecção de desvio IPDD/ADWIN e OOUX — para o gestor de manutenção agir na degradação cedo, não depois da parada.',
    body: `The shop floor runs at the edge of capacity. Machines are asked to stay up; when one slips into failure, the cost is not only the repair — it is the unplanned stop that breaks the chain. Condition-based maintenance exists to act on the first sign of degradation. The hard part is seeing that sign in time, inside the event logs Industry 4.0 learned to record at volume, but not to structure for a decision.

Deviante started from that gap, in a PIBITI project at PUCPR. The research object was IPDD — Interactive Process Drift Detection — a framework that watches how a process behaves over time instead of freezing one static model from the whole log. ADWIN (adaptive windowing) tracks activity sojourn times in windows that grow and shrink on their own. When the recent mean diverges from the old one beyond a statistical threshold δ, the system flags a concept drift: a candidate for inspection, still on the P-F curve, before functional failure.

Flat process-mining logs are thin for that job. An event carries a case id, an activity name, and a timestamp — almost none of the management context. With no hierarchy among objects and attributes, a manager has to weigh too many parameters at once. Decision neuroscience points to orbitofrontal cortex when people value multi-attribute objects; the interface has to respect that. Industry 5.0 asks for the same thing: automated prediction informs human judgment, it does not replace it.

So the product was modeled with OOUX and the ORCA process (objects, relationships, CTAs, attributes). Mining nouns in the maintenance literature produced six objects of value — process, operation, monitoring, machine, analysis, and proactive action — and nine use cases, from sign-in to machine monitoring. In v1.0 the user object is there to authenticate. The person who actually operates the system is the manager, around process and analysis.

Once the semantic model was closed, the code could start in natural language. The front end is React with Vite; the API is Kotlin, with a mobile future in mind; IPDD/ADWIN runs in a Python microservice (FastAPI + PM4Py) with no database of its own — compute only. Google auth and persistence live on Supabase. A third repository, Gestalt-Kit, holds agents, skills, and constraints so a lineup of models (Maestro, shipper, OOUX) can build in parallel without losing the domain.

On the process screen the manager creates an instance, uploads a CSV or XES file, and maps operations that can be shared across processes. The directly-follows graph is aggregated in the API from events already stored — not the raw PM4Py drawing. On the right, traces and variants can be dropped from the next analysis; in the corner, δ and the other parameters update live. The manager sees exactly what will run before asking for processing.

The analysis screen plots the start of the anomaly in yellow and the failure point in red. The same trace filters stay on the right, so the vocabulary does not have to be relearned. Any change to δ or to the trace set re-runs IPDD. Eight of the nine v1.0 use cases closed their main flow. UC7 — scheduling inspection or maintenance from the P-F curve — waits for the next stage, when real shop-floor data can feed supervised interval recommendations.

The framework is live for tests with maintenance managers. The final report’s claim still holds: well-named objects, explicit use cases, and a context kit for AI are enough to build a decision-support system for industrial maintenance — as long as the human stays at the center of the call.`,
    body_pt: `A manufatura vive no limite: as máquinas precisam permanecer no ar, e cada hora de disponibilidade conta. Quando um ativo entra em modo de falha, o custo não é só o reparo — é a parada não prevista na cadeia produtiva. Manutenção preventiva baseada em condição (CBM) existe para agir no primeiro sinal de degradação. O problema é enxergar esse sinal a tempo, no meio de logs de eventos que a Indústria 4.0 passou a registrar em volume, mas sem estrutura para decisão.

O Deviante nasceu dessa lacuna, no PIBITI da PUCPR. O ponto de partida foi o IPDD — Interactive Process Drift Detection —, um framework que lê o comportamento de um processo ao longo do tempo em vez de congelar um único modelo estático. Com o algoritmo ADWIN (janela adaptativa), a duração das atividades (sojourn time) é monitorada em janelas que crescem e encolhem sozinhas. Quando a média recente diverge da antiga além de um limiar estatístico δ, o sistema marca um desvio de conceito: candidato a inspeção, ainda no trecho potencial-funcional da curva P-F, antes da falha.

Logs planos de mineração de processos, porém, são pouco expressivos. Cada evento traz caso, atividade e timestamp — e quase nada do contexto de gestão. Sem hierarquia entre objetos e atributos, o gestor compara demais parâmetros ao mesmo tempo. A neurociência da decisão aponta o córtex orbitofrontal na avaliação de objetos com múltiplos atributos; a interface precisa respeitar isso. Indústria 5.0 pede o mesmo: a previsão automatizada informa o julgamento humano, não o substitui.

Por isso o produto foi modelado com OOUX e o processo ORCA (objetos, relacionamentos, CTAs, atributos). A busca por substantivos na literatura de manutenção resultou em seis objetos de valor — processo, operação, monitoramento, máquina, análise e ação proativa — e nove casos de uso, da autenticação ao monitoramento de máquina. Na v1.0 o objeto usuário existe para autenticar. Quem opera o sistema é o gestor, em torno de processo e análise.

Com o modelo semântico fechado, o código pôde começar em linguagem natural. O front-end é React com Vite; a API, Kotlin, pensando num futuro móvel; o IPDD/ADWIN roda num microsserviço Python (FastAPI + PM4Py), sem banco, só computação. Autenticação Google e persistência ficam no Supabase. Um terceiro repositório — o Gestalt-Kit — guarda agentes, skills e restrições para um time de modelos (Maestro, shipper, OOUX) desenvolver em paralelo sem perder o domínio.

Na tela do processo, o gestor cria uma instância, carrega um CSV ou XES e mapeia operações que podem ser compartilhadas entre processos. O grafo de precedência direta (DFG) é agregado na API a partir dos eventos já persistidos — não é o desenho cru do PM4Py. À direita, traces e variantes podem ser excluídos da próxima análise; no canto, δ e os demais parâmetros atualizam ao vivo. O gestor sabe exatamente o que vai disparar antes de pedir o processamento.

A tela da análise mostra o gráfico com o início da anomalia em amarelo e o ponto de falha em vermelho. Os mesmos filtros de trace permanecem à direita, para não reaprender o vocabulário. Qualquer mudança em δ ou no conjunto de traces reabre o IPDD. Oito das nove UCs da v1.0 fecharam o fluxo principal. A UC7 — agendar inspeção ou manutenção a partir da curva P-F — ficou para a etapa seguinte, quando dados reais de chão de fábrica alimentarem recomendações supervisionadas de intervalo.

O framework está no ar para testes com gestores. A aposta que o relatório final confirma: objetos bem nomeados, casos de uso explícitos e um kit de contexto para IA bastam para construir um sistema de suporte à decisão em manutenção — desde que o humano continue no centro da ponderação.`,
    cover_url: null,
    external_url: null,
    status: 'published',
    sort_order: 0,
  },
  {
    code: 'asteroids',
    product_code: null,
    title: 'Near-Earth asteroids: classifying potentially hazardous objects',
    title_pt: 'Asteroides próximos à Terra: classificando objetos potencialmente perigosos',
    summary:
      '120-hour Data Science capstone at PUCPR — NASA/JPL catalog (958k records), exploratory analysis, and ML to flag PHAs. XGBoost reaches PR-AUC 0.89 on the realistic track without definitional leakage.',
    summary_pt:
      'Trabalho de conclusão de Data Science (120 h) na PUCPR — catálogo NASA/JPL (958 mil registros), análise exploratória e ML para identificar PHAs. XGBoost atinge PR-AUC 0,89 na trilha realista, sem vazamento da regra oficial.',
    body: `The final project for PUCPR's 120-hour Data Science course (2026-1) asked a concrete question: can we classify Potentially Hazardous Asteroids (PHAs) from orbital and physical catalog data? Our team worked on NASA's JPL Small-Body Database snapshot — 958,524 records and 45 attributes — sourced via Kaggle and maintained by Caltech/JPL under NASA.

We framed the problem as binary classification on \`pha\` (Y/N). After removing identifier columns, rows without labels, and physical fields with more than 85% missing values (\`diameter\`, \`albedo\`), we restricted the population to Near-Earth Objects (\`neo = Y\`). Every PHA is a NEO, but distant main-belt asteroids can never be hazardous to Earth — including them would only add noise. The modeling set landed at 22,891 NEOs: roughly 9% PHAs and 91% non-PHAs. Accuracy alone would be misleading; we tracked precision, recall, F1, and especially PR-AUC.

Exploratory analysis covered twenty univariate questions: class proportions, orbital families (Apollos, Atens, Amors, Atiras), absolute magnitude H, minimum orbital intersection distance (MOID), eccentricity, inclination, and orbital period. Hypotheses guided the work: proximity to Earth, object size, and orbital geometry all shape risk. Where side-by-side comparison would hide the minority class, we used a balanced sample (\`df_equal\`) for visualization only — never for training metrics.

Two modeling tracks kept the science honest. Track A kept \`moid\` and \`moid_ld\`, variables embedded in NASA's formal PHA definition. Random Forest looked almost perfect (PR-AUC 0.997, F1 0.98) — classic data leakage. The model learns the rule book, not general orbital physics. Track B removed those definitional features: the realistic scenario for early triage when MOID is unknown, noisy, or withheld.

On Track B, logistic regression collapsed (PR-AUC 0.38); hazard is nonlinear. Random Forest recall fell from 0.99 to 0.39 without MOID. The best performer was XGBoost with hyperparameter tuning and \`scale_pos_weight\`: PR-AUC 0.8952, recall 0.86, F1 0.8227 — a strong balance for observational prioritization. SMOTE pushed recall higher but hurt precision; native class weighting beat synthetic oversampling on this dataset.

The deliverable pairs the Jupyter notebook with a slide deck and publication-ready charts — the same narrative we will carry to Behance as a data-science case study, with a hero visualization opening the story. Next steps: richer physical features when available, probability calibration, SHAP explainability, and monitoring for dataset shift as NASA refreshes the catalog.`,
    body_pt: `O trabalho de conclusão da disciplina de Data Science (120 horas) do Bacharelado em Ciência da Computação da PUCPR (2026-1) partiu de uma pergunta objetiva: é possível classificar Asteroides Potencialmente Perigosos (PHAs) a partir de dados orbitais e físicos de catálogo? O grupo trabalhou sobre um recorte do Small-Body Database do JPL/NASA — 958.524 registros e 45 atributos — disponibilizado via Kaggle e mantido pelo Jet Propulsion Laboratory.

O problema foi modelado como classificação binária em \`pha\` (Y/N). Removemos colunas identificadoras, registros sem rótulo e variáveis físicas com mais de 85% de ausência (\`diameter\`, \`albedo\`). Em seguida, filtramos apenas Objetos Próximos à Terra (\`neo = Y\`): todo PHA é NEO, mas asteroides distantes do cinturão principal nunca seriam perigosos — mantê-los só adicionaria ruído. O conjunto final ficou com 22.891 NEOs, cerca de 9% PHAs e 91% não-PHAs. Acurácia isolada seria enganosa; usamos precisão, recall, F1 e, principalmente, PR-AUC.

A análise exploratória respondeu a vinte perguntas univariadas: proporções de classe, famílias orbitais (Apolos, Atens, Amores, Atiras), magnitude absoluta H, distância mínima de interseção orbital (MOID), excentricidade, inclinação e período orbital. As hipóteses H1–H3 orientaram o estudo: proximidade com a Terra, tamanho e geometria orbital influenciam o risco. Quando a comparação visual exigia equilíbrio entre classes, usamos uma amostra balanceada (\`df_equal\`) só para visualização — nunca para métricas de treino.

Duas trilhas mantiveram o rigor científico. A Trilha A conservou \`moid\` e \`moid_ld\`, variáveis da definição formal de PHA da NASA. A Floresta Aleatória parecia quase perfeita (PR-AUC 0,997; F1 0,98) — vazamento de dados clássico. O modelo decora a regra, não a física orbital generalizada. A Trilha B removeu esses atributos definicionais: o cenário realista de triagem quando o MOID ainda não está disponível ou é incerto.

Na Trilha B, a regressão logística colapsou (PR-AUC 0,38); o risco é não linear. O recall da Floresta Aleatória caiu de 0,99 para 0,39 sem MOID. O melhor resultado veio do XGBoost com tuning de hiperparâmetros e \`scale_pos_weight\`: PR-AUC 0,8952, recall 0,86, F1 0,8227 — bom equilíbrio para priorização observacional. O SMOTE elevou o recall, mas reduziu a precisão; o peso de classe nativo superou o oversampling sintético neste dataset.

A entrega combina o notebook Jupyter, slides de apresentação e gráficos prontos para publicação — o mesmo material que abrirá o case no Behance, com imagem de destaque no topo. Próximos passos: incorporar atributos físicos mais completos, calibrar probabilidades, explicabilidade com SHAP e monitorar dataset shift conforme a NASA atualiza o catálogo.`,
    cover_url: null,
    external_url: null,
    status: 'published',
    sort_order: 2,
  },
]

export function loadStaticProject(code, locale = 'en') {
  const row = FALLBACK_ROWS.find((entry) => entry.code === code)
  if (!row) return null
  return localizeProject(row, locale)
}

export function loadStaticProjects(locale = 'en') {
  return FALLBACK_ROWS.map((row) => localizeProject(row, locale))
}
