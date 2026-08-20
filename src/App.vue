<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { DataSet, Network } from "vis-network/standalone";
import {
  bands,
  emissionClasses,
  flattenKnowledgeTree,
  knowledgeTree,
  phoneticAlphabet,
  qCodes,
  zones
} from "./data/ham-a.js";

const graphEl = ref(null);
const viewMode = ref("graph");
const searchText = ref("");
const searchOpen = ref(false);
const selected = ref(null);
const theme = ref(
  localStorage.getItem("ham-theme") ||
    (window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light")
);

const expanded = ref(new Set(["root", "law", "comm", "tech", "equip", "safety"]));
const { items: allItems, parentMap } = flattenKnowledgeTree();
const itemMap = new Map(allItems.map((item) => [item.id, item]));

const moduleColors = {
  law: "#a78bfa",
  comm: "#38bdf8",
  tech: "#34d399",
  equip: "#f59e0b",
  safety: "#fb7185"
};

let network = null;

function applyTheme() {
  document.documentElement.dataset.theme = theme.value;
  localStorage.setItem("ham-theme", theme.value);
}

function toggleTheme() {
  theme.value = theme.value === "dark" ? "light" : "dark";
}

const searchResults = computed(() => {
  const keyword = searchText.value.trim().toLowerCase();
  if (!keyword) return [];

  return allItems
    .filter((item) => {
      const haystack = [
        item.title,
        item.summary,
        ...(item.tags || []),
        ...(item.points || [])
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(keyword);
    })
    .slice(0, 12);
});

function expandAncestors(id) {
  const ids = new Set(expanded.value);
  let current = id;

  while (parentMap.has(current)) {
    const parent = parentMap.get(current);
    ids.add(parent);
    current = parent;
  }

  expanded.value = ids;
}

async function locateNode(item) {
  selected.value = item;
  searchText.value = item.title;
  searchOpen.value = false;
  expandAncestors(item.id);
  viewMode.value = "graph";
  await nextTick();
  renderNetwork(item.id);
}

function visibleGraphData() {
  const nodes = [];
  const edges = [];

  function walk(item, parentId = null, depth = 0, moduleId = null) {
    const currentModule = depth === 1 ? item.id : moduleId;
    nodes.push({ ...item, depth, moduleId: currentModule });

    if (parentId) edges.push({ from: parentId, to: item.id });

    if (expanded.value.has(item.id)) {
      for (const child of item.children || []) {
        walk(child, item.id, depth + 1, currentModule);
      }
    }
  }

  walk(knowledgeTree);
  return { nodes, edges };
}

function getNodeColor(item) {
  if (item.id === "root") return "#22d3ee";
  if (item.depth === 1) return moduleColors[item.id] || "#38bdf8";
  return moduleColors[item.moduleId] || "#64748b";
}

function renderNetwork(focusId = null) {
  if (viewMode.value !== "graph" || !graphEl.value) return;

  if (network) {
    network.destroy();
    network = null;
  }

  const data = visibleGraphData();
  const dark = theme.value === "dark";

  const visNodes = new DataSet(
    data.nodes.map((item) => ({
      id: item.id,
      label: item.title,
      shape: "dot",
      size:
        item.depth === 0
          ? 34
          : item.depth === 1
            ? 26
            : item.children?.length
              ? 19
              : 13,
      color: {
        background: getNodeColor(item),
        border:
          item.level === "warning"
            ? "#ef4444"
            : dark
              ? "#dbeafe"
              : "#0f172a",
        highlight: { background: "#facc15", border: "#f8fafc" },
        hover: { background: getNodeColor(item), border: "#ffffff" }
      },
      borderWidth: item.level === "important" ? 3 : 1,
      font: {
        color: dark ? "#e5edf7" : "#172033",
        size: item.depth <= 1 ? 16 : 13,
        face: "-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif",
        strokeWidth: 0
      },
      title: item.summary || item.title
    }))
  );

  const visEdges = new DataSet(
    data.edges.map((edge, index) => ({
      id: `e-${index}`,
      ...edge,
      arrows: { to: { enabled: true, scaleFactor: 0.35 } },
      color: {
        color: dark ? "#334155" : "#cbd5e1",
        highlight: "#38bdf8"
      }
    }))
  );

  network = new Network(
    graphEl.value,
    { nodes: visNodes, edges: visEdges },
    {
      autoResize: true,
      nodes: {
        shadow: { enabled: true, size: 12, x: 0, y: 4 }
      },
      edges: {
        width: 1.2,
        smooth: { enabled: true, type: "dynamic", roundness: 0.4 }
      },
      interaction: {
        hover: true,
        dragNodes: true,
        dragView: true,
        zoomView: true,
        navigationButtons: true,
        keyboard: true,
        tooltipDelay: 120
      },
      physics: {
        enabled: true,
        solver: "forceAtlas2Based",
        forceAtlas2Based: {
          gravitationalConstant: -58,
          centralGravity: 0.015,
          springLength: 135,
          springConstant: 0.045,
          damping: 0.45,
          avoidOverlap: 0.65
        },
        stabilization: { enabled: true, iterations: 180, fit: true }
      }
    }
  );

  network.on("click", ({ nodes }) => {
    if (!nodes.length) return;
    selected.value = itemMap.get(nodes[0]);
  });

  network.on("doubleClick", ({ nodes }) => {
    if (!nodes.length) return;
    const item = itemMap.get(nodes[0]);
    if (item?.children?.length) toggleExpand(item.id);
  });

  if (focusId) {
    setTimeout(() => {
      if (!network || !visNodes.get(focusId)) return;
      network.selectNodes([focusId]);
      network.focus(focusId, {
        scale: 1.25,
        animation: { duration: 550, easingFunction: "easeInOutQuad" }
      });
    }, 180);
  }
}

function toggleExpand(id) {
  const item = itemMap.get(id);
  if (!item?.children?.length) return;

  const ids = new Set(expanded.value);
  if (ids.has(id)) ids.delete(id);
  else ids.add(id);
  expanded.value = ids;
  renderNetwork(id);
}

function resetGraph() {
  network?.fit({
    animation: { duration: 450, easingFunction: "easeInOutQuad" }
  });
}

async function setView(mode) {
  viewMode.value = mode;
  if (mode === "graph") {
    await nextTick();
    renderNetwork();
  }
}

onMounted(async () => {
  applyTheme();
  await nextTick();
  renderNetwork();
});

onBeforeUnmount(() => network?.destroy());

watch(theme, async () => {
  applyTheme();
  await nextTick();
  renderNetwork();
});
</script>

<template>
  <div class="app-shell">
    <header class="topbar">
      <div class="brand">
        <div class="brand-mark">RF</div>
        <div>
          <div class="brand-title">HAM A证</div>
          <div class="brand-subtitle">全景知识图谱</div>
        </div>
      </div>

      <div class="route-pill">dronerfdiy.com/redio</div>

      <div class="header-actions">
        <div class="search-wrap">
          <span class="search-icon">⌕</span>
          <input
            v-model="searchText"
            class="search-input"
            type="search"
            placeholder="搜索 QSL、430MHz、避雷、A1A..."
            @focus="searchOpen = true"
            @input="searchOpen = true"
            @keydown.esc="searchOpen = false"
          />

          <div v-if="searchOpen && searchText && searchResults.length" class="search-results">
            <button
              v-for="item in searchResults"
              :key="item.id"
              class="search-result"
              @click="locateNode(item)"
            >
              <span>{{ item.title }}</span>
              <small>{{ item.summary }}</small>
            </button>
          </div>
        </div>

        <div class="view-switch">
          <button :class="{ active: viewMode === 'graph' }" @click="setView('graph')">图谱</button>
          <button :class="{ active: viewMode === 'cards' }" @click="setView('cards')">卡片</button>
        </div>

        <button class="icon-button" title="切换亮色/暗色" @click="toggleTheme">
          {{ theme === "dark" ? "☀" : "☾" }}
        </button>
      </div>
    </header>

    <section class="hero">
      <div>
        <div class="eyebrow">AMATEUR RADIO · CLASS A</div>
        <h1>业余无线电 A 证考试 <span>全景知识图谱</span></h1>
        <p>
          把题号拆掉，把法规、呼号、Q 简语、频段、传播、设备和安全重新连接成一张真正可理解、可搜索、可交互的知识网络。
        </p>
      </div>

      <div class="hero-stats">
        <div class="stat"><strong>30–3000</strong><span>MHz · A类</span></div>
        <div class="stat"><strong>≤25</strong><span>W · 最大功率</span></div>
        <div class="stat"><strong>5</strong><span>大知识模块</span></div>
      </div>
    </section>

    <main class="main-content">
      <section v-show="viewMode === 'graph'" class="graph-panel">
        <div class="panel-head">
          <div>
            <span class="section-kicker">INTERACTIVE MAP</span>
            <h2>知识拓扑</h2>
            <p>单击查看详情 · 双击展开/收起 · 鼠标滚轮缩放 · 拖动节点自由布局</p>
          </div>
          <button class="secondary-button" @click="resetGraph">⌂ 复位视图</button>
        </div>
        <div ref="graphEl" class="knowledge-network"></div>
      </section>

      <section v-if="viewMode === 'cards'" class="cards-view">
        <div v-for="module in knowledgeTree.children" :key="module.id" class="module-card">
          <div class="module-card-top">
            <span class="module-dot" :style="{ background: moduleColors[module.id] }"></span>
            <div>
              <h2>{{ module.title }}</h2>
              <p>{{ module.summary }}</p>
            </div>
          </div>

          <div class="topic-grid">
            <button
              v-for="topic in module.children"
              :key="topic.id"
              class="topic-card"
              @click="selected = topic"
            >
              <strong>{{ topic.title }}</strong>
              <span>{{ topic.summary }}</span>
              <small>{{ topic.children?.length ? `${topic.children.length} 个知识节点` : "查看详情" }}</small>
            </button>
          </div>
        </div>

        <section class="special-card">
          <span class="section-kicker">CALLSIGN ZONES</span>
          <h2>中国业余无线电呼号分区</h2>
          <div class="zone-grid">
            <article v-for="zone in zones" :key="zone.zone" class="zone-card">
              <div class="zone-number">{{ zone.zone }}</div>
              <div>
                <strong>{{ zone.zone }} 区</strong>
                <p>{{ zone.regions.join(" · ") }}</p>
              </div>
            </article>
          </div>
        </section>

        <section class="special-card">
          <span class="section-kicker">Q CODES</span>
          <h2>常用 Q 简语</h2>
          <div class="q-grid">
            <article v-for="q in qCodes" :key="q.code" class="q-card">
              <strong>{{ q.code }}</strong>
              <h3>{{ q.meaning }}</h3>
              <p>{{ q.detail }}</p>
            </article>
          </div>
        </section>

        <section class="special-card">
          <span class="section-kicker">PHONETIC ALPHABET</span>
          <h2>ITU 字母解释法 A–Z</h2>
          <div class="phonetic-grid">
            <div v-for="item in phoneticAlphabet" :key="item.letter" class="phonetic-item">
              <strong>{{ item.letter }}</strong>
              <span>{{ item.word }}</span>
            </div>
          </div>
        </section>

        <section class="special-card">
          <span class="section-kicker">CLASS A LIMIT</span>
          <h2>A 类频段与功率</h2>
          <div class="notice-card">
            <strong>现行题库口径：</strong>A 类工作能力范围为 30–3000 MHz，最大发射功率不大于 25 W；7/14/21/28 MHz 均低于 30 MHz，因此 A 类不可操作。
          </div>
          <div class="table-scroll">
            <table class="data-table">
              <thead>
                <tr><th>波段</th><th>范围</th><th>A 类</th><th>最大功率</th><th>备注</th></tr>
              </thead>
              <tbody>
                <tr v-for="band in bands" :key="band.name">
                  <td><strong>{{ band.name }}</strong></td>
                  <td>{{ band.range }}</td>
                  <td><span class="status" :class="band.aAllowed ? 'ok' : 'no'">{{ band.aAllowed ? "允许" : "不允许" }}</span></td>
                  <td>{{ band.power }}</td>
                  <td>{{ band.note }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="special-card">
          <span class="section-kicker">EMISSION DESIGNATORS</span>
          <h2>发射类别</h2>
          <div class="emission-grid">
            <article v-for="item in emissionClasses" :key="item.code" class="emission-card">
              <div class="emission-code">{{ item.code }}</div>
              <h3>{{ item.name }}</h3>
              <ul>
                <li v-for="text in item.chars" :key="text">{{ text }}</li>
              </ul>
            </article>
          </div>
        </section>
      </section>
    </main>

    <transition name="drawer">
      <aside v-if="selected" class="detail-drawer">
        <div class="drawer-head">
          <div>
            <span class="section-kicker">KNOWLEDGE NODE</span>
            <h2>{{ selected.title }}</h2>
          </div>
          <button class="close-button" @click="selected = null">×</button>
        </div>

        <p class="drawer-summary">{{ selected.summary }}</p>

        <div v-if="selected.points?.length" class="detail-points">
          <div v-for="point in selected.points" :key="point" class="detail-point">{{ point }}</div>
        </div>

        <div v-if="selected.tags?.length" class="tag-list">
          <span v-for="tag in selected.tags" :key="tag">{{ tag }}</span>
        </div>

        <div v-if="selected.children?.length" class="drawer-children">
          <div class="drawer-subtitle">下级知识节点</div>
          <button v-for="child in selected.children" :key="child.id" @click="selected = child">
            <strong>{{ child.title }}</strong>
            <span>{{ child.summary }}</span>
          </button>
        </div>

        <button
          v-if="selected.children?.length && viewMode === 'graph'"
          class="primary-button full"
          @click="toggleExpand(selected.id)"
        >
          {{ expanded.has(selected.id) ? "收起此节点" : "展开此节点" }}
        </button>
      </aside>
    </transition>

    <div v-if="selected" class="drawer-overlay" @click="selected = null"></div>
  </div>
</template>
