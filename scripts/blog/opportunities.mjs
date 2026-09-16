// 从 Search Console 查询数据里挑选"最值得写一篇文章"的关键词簇。
//
// 第一性原理：一篇新文章能带来的增量点击 ≈ 曝光 × (目标位置的期望点击率 − 当前点击率)。
// 曝光证明需求真实存在；当前位置在 4–30 之间说明 Google 已经认为站点相关，只差一个更贴题的页面；
// 已经被现有文章覆盖或属于品牌词的查询不再重复写。

const brandPattern = /foxue|佛学\s*\.?\s*ai|佛学ai/i;

export function expectedCtr(position) {
  if (position <= 1) return 0.28;
  if (position <= 2) return 0.15;
  if (position <= 3) return 0.11;
  if (position <= 5) return 0.075;
  if (position <= 10) return 0.04;
  if (position <= 20) return 0.015;
  if (position <= 50) return 0.006;
  return 0.002;
}

function strikingDistanceWeight(position) {
  if (position >= 4 && position <= 20) return 1;
  if (position > 20 && position <= 30) return 0.75;
  if (position > 30 && position <= 50) return 0.4;
  if (position < 4) return 0.3;
  return 0.15;
}

const targetCtr = expectedCtr(3);

export function scoreQuery(row) {
  const potential = row.impressions * targetCtr;
  const gap = Math.max(0, potential - row.clicks);
  return gap * strikingDistanceWeight(row.position);
}

export function characterBigrams(text) {
  const characters = Array.from(normalizeQuery(text));
  if (characters.length < 2) return new Set(characters);
  const grams = new Set();
  for (let index = 0; index < characters.length - 1; index += 1) grams.add(characters[index] + characters[index + 1]);
  return grams;
}

export function normalizeQuery(text) {
  return text
    .toLocaleLowerCase()
    .replace(/[\s《》「」『』“”"'‘’,，。？?！!:：;；、()（）\-—·]/g, "")
    .trim();
}

export function similarity(a, b) {
  const na = normalizeQuery(a);
  const nb = normalizeQuery(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.85;
  const ga = characterBigrams(na);
  const gb = characterBigrams(nb);
  let shared = 0;
  for (const gram of ga) if (gb.has(gram)) shared += 1;
  const union = ga.size + gb.size - shared;
  return union > 0 ? shared / union : 0;
}

/**
 * 贪心聚簇：按分值降序，把与簇头相似的查询并入同一簇。
 */
export function clusterQueries(rows, { minImpressions = 20, threshold = 0.45 } = {}) {
  const candidates = rows
    .filter((row) => row.impressions >= minImpressions && !brandPattern.test(row.query))
    .map((row) => ({ ...row, score: scoreQuery(row) }))
    .sort((a, b) => b.score - a.score);

  const clusters = [];
  for (const row of candidates) {
    const cluster = clusters.find((item) => similarity(item.head.query, row.query) >= threshold);
    if (cluster) {
      cluster.members.push(row);
      cluster.score += row.score;
      cluster.impressions += row.impressions;
      cluster.clicks += row.clicks;
    } else {
      clusters.push({ head: row, members: [row], score: row.score, impressions: row.impressions, clicks: row.clicks });
    }
  }
  return clusters.sort((a, b) => b.score - a.score);
}

export function isCoveredByPosts(head, posts, { threshold = 0.6 } = {}) {
  return posts.some((post) => {
    const keywords = [post.keywords?.primary, ...(post.keywords?.secondary ?? []), post.title].filter(Boolean);
    return keywords.some((keyword) => similarity(keyword, head) >= threshold);
  });
}

/**
 * 返回今天要写的选题：{ primary, secondary, source, queries, note }。
 */
export function pickTopic({ gscQueries, posts, seeds, forcedTopic }) {
  if (forcedTopic) {
    const related = gscQueries.filter((row) => similarity(row.query, forcedTopic) >= 0.45).slice(0, 12);
    const seed = seeds.find((item) => similarity(item.primary, forcedTopic) >= 0.6);
    return {
      primary: forcedTopic,
      secondary: unique([...(seed?.secondary ?? []), ...related.map((row) => row.query)]).filter((k) => k !== forcedTopic).slice(0, 8),
      source: related.length > 0 ? "gsc" : "seed",
      queries: related,
      anchors: seed?.anchors ?? [],
      intent: seed?.intent ?? "",
      note: "手动指定选题",
    };
  }

  if (gscQueries.length > 0) {
    const clusters = clusterQueries(gscQueries);
    const open = clusters.find((cluster) => !isCoveredByPosts(cluster.head.query, posts));
    if (open) {
      const seed = seeds.find((item) => similarity(item.primary, open.head.query) >= 0.6);
      return {
        primary: open.head.query,
        secondary: unique([...open.members.slice(1).map((row) => row.query), ...(seed?.secondary ?? [])])
          .filter((keyword) => normalizeQuery(keyword) !== normalizeQuery(open.head.query))
          .slice(0, 8),
        source: "gsc",
        queries: open.members.slice(0, 12).map(({ query, clicks, impressions, ctr, position }) => ({
          query,
          clicks,
          impressions,
          ctr: Number(ctr.toFixed(4)),
          position: Number(position.toFixed(1)),
        })),
        anchors: seed?.anchors ?? [],
        intent: seed?.intent ?? "",
        clusterScore: Number(open.score.toFixed(1)),
        note: `聚簇分值 ${open.score.toFixed(1)}；簇内 ${open.members.length} 个查询，合计曝光 ${open.impressions}，点击 ${open.clicks}`,
      };
    }
  }

  const seed = seeds.find((item) => !isCoveredByPosts(item.primary, posts));
  if (!seed) throw new Error("种子关键词已全部写完，且没有新的 Search Console 机会；请补充 content/blogs/seed-keywords.json");
  return {
    primary: seed.primary,
    secondary: seed.secondary ?? [],
    source: "seed",
    queries: [],
    anchors: seed.anchors ?? [],
    intent: seed.intent ?? "",
    note: gscQueries.length > 0 ? "GSC 有数据但机会簇均已覆盖，回落到种子关键词" : "GSC 未接入或无数据，使用种子关键词",
  };
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}
