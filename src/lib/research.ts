import { sutras } from "@/data/sutras";
import {
  dependentOriginationConcept,
  eightfoldPathConcept,
  emptinessConcept,
  fourNobleTruthsConcept,
  impermanenceConcept,
  nonAbidingConcept,
  nonSelfConcept,
  observingMindConcept,
  type ConceptEntry,
} from "@/lib/concepts";
import {
  PASSAGE_QUESTION_PROMPT,
  type QuestionSourceContext,
} from "@/lib/question-session";
import { segmentHref } from "@/lib/reader-routes";

export type Evidence = {
  label: string;
  quote: string;
  href: string;
  source: string;
  locator: string;
  relation: "直接" | "相关";
};

export type ResearchResult = {
  query: string;
  status:
    | "有充分来源"
    | "仅找到间接资料"
    | "未找到可靠来源"
    | "来源存在分歧";
  title: string;
  answer: string[];
  caution: string;
  evidence: Evidence[];
  concept?: ConceptEntry;
};

function evidenceFor(slug: string, segmentIndex: number, relation: "直接" | "相关" = "直接") {
  const sutra = sutras.find((item) => item.slug === slug);
  if (!sutra) return null;
  const segment = sutra.segments[segmentIndex];
  if (!segment) return null;
  return {
    label: sutra.alternateTitle,
    quote: segment.text,
    href: segmentHref(sutra.slug, segment.id),
    source: sutra.sourceName,
    locator: segment.id,
    relation,
  } satisfies Evidence;
}

function inlineEvidence(evidence: Evidence) {
  return evidence;
}

function attachSourceContext(
  result: ResearchResult,
  sourceContext?: QuestionSourceContext | null,
  includeAsEvidence = false,
): ResearchResult {
  if (!sourceContext || !includeAsEvidence) return result;

  const selectedEvidence: Evidence = {
    label: sourceContext.workTitle,
    quote: sourceContext.quote,
    href: sourceContext.sourceHref,
    source: sourceContext.sourceName,
    locator: sourceContext.locator,
    relation: "直接",
  };

  return {
    ...result,
    evidence: [
      selectedEvidence,
      ...result.evidence.filter((item) =>
        item.locator !== selectedEvidence.locator
        || item.href !== selectedEvidence.href,
      ),
    ],
  };
}

export function buildResearchResult(
  rawQuery: string,
  sourceContext?: QuestionSourceContext | null,
): ResearchResult {
  const query = rawQuery.trim();
  const isInitialPassageQuestion = query === PASSAGE_QUESTION_PROMPT;
  const has = (...words: string[]) => words.some((word) => query.includes(word));
  const sourceHas = (...phrases: string[]) => Boolean(
    isInitialPassageQuestion
    && sourceContext
    && phrases.some((phrase) => sourceContext.quote.includes(phrase)),
  );
  const sourceIs = (...hrefPrefixes: string[]) => Boolean(
    isInitialPassageQuestion
    && sourceContext
    && hrefPrefixes.some((prefix) => sourceContext.sourceHref.startsWith(prefix)),
  );
  const finish = (result: ResearchResult) => attachSourceContext(
    result,
    sourceContext,
    isInitialPassageQuestion,
  );

  if (
    has(
      "八正道",
      "八聖道",
      "八圣道",
      "八支圣道",
      "八支聖道",
      "圣八支道",
      "聖八支道",
      "ariyo aṭṭhaṅgiko maggo",
      "Ariyaṁ vo, bhikkhave, aṭṭhaṅgikaṁ maggaṁ desessāmi",
      "ariyaṁ aṭṭhaṅgikaṁ maggaṁ",
      "ariya atthangika magga",
      "ariyam atthangikam maggam",
      "noble eightfold path",
      "Noble Eightfold Path",
    )
    || sourceHas(
      "有八正道，能斷愛欲",
      "有八正道，能断爱欲",
      "正見、正志、正語、正業、正命、正方便、正念、正定",
      "正见、正志、正语、正业、正命、正方便、正念、正定",
      "Ariyaṁ vo, bhikkhave, aṭṭhaṅgikaṁ maggaṁ desessāmi",
      "Katamo ca, bhikkhave, ariyo aṭṭhaṅgiko maggo",
    )
    || (
      sourceIs("/jingzang/samyutta-nikaya-sn45/008-sn45-8-0001-0044#")
      && sourceHas(
        "sammādiṭṭhi",
        "sammāsaṅkappo",
        "sammāvācā",
        "sammākammanto",
        "sammāājīvo",
        "sammāvāyāmo",
        "sammāsati",
        "sammāsamādhi",
      )
    )
  ) {
    return finish({
      query,
      status: "有充分来源",
      title: "八正道不是八条孤立规则，而是同属一条趋向苦灭道路的八支",
      answer: [
        "《杂阿含经》第 752 经用“有八正道，能断爱欲”交代道路目标，并列正见、正志、正语、正业、正命、正方便、正念、正定；第 749 经又把明、正见、其余诸支、正定与解脱放在连续关系中。八支因此不宜读成互不相干的打卡项目。",
        "《中阿含经·分别圣谛经》把八支放在苦灭道圣谛中逐项解释：见解与意向会进入言语、行为和生计，也需要用力、觉察与定。只突出“正念”或“正见”，都会删掉道路的其余部分。",
        "巴利 SN 45.8 同样逐支定义：正见知苦集灭道，正意向指向出离、无瞋与不害，正语、正业、正命进入可观察的生活，正精进、正念与正定又分别展开。实践上可从一件具体处境检查八支怎样互相影响，而不是急着给自己总分。",
      ],
      caution:
        "T0099、T0026 与 SN 45.8 在八支结构上可作相关并读，但当前没有双人审校结论支持严格平行经认定；“正志／正思惟”“正方便／正精进”等译语应保留版本边界，巴利中文均为本站工作释义。",
      concept: eightfoldPathConcept,
      evidence: [
        inlineEvidence({
          label: "《杂阿含经》T0099 · 第 752 经",
          quote: "有八正道，能斷愛欲，謂正見、正志、正語、正業、正命、正方便、正念、正定。",
          href: "/jingzang/zaahanjing/028-0199a#T0099.028.0199a10",
          source: "CBETA T02n0099",
          locator: "T0099.028.0199a10–11",
          relation: "直接",
        }),
        inlineEvidence({
          label: "《杂阿含经》T0099 · 第 749 经",
          quote: "若起明為前相，生諸善法。……能生正見，正見生已，起正志、正語、正業、正命、正方便、正念、正定，次第而起。",
          href: "/jingzang/zaahanjing/028-0198b#T0099.028.0198b19",
          source: "CBETA T02n0099",
          locator: "T0099.028.0198b19–24",
          relation: "直接",
        }),
        inlineEvidence({
          label: "《中阿含经》T0026 ·《分别圣谛经》",
          quote: "云何苦滅道聖諦？謂正見、正志、正語、正業、正命、正方便、正念、正定。",
          href: "/jingzang/zhongahanjing/007-0469a#T0026.007.0469a13",
          source: "CBETA T01n0026",
          locator: "T0026.007.0469a13–0469b29",
          relation: "直接",
        }),
        inlineEvidence({
          label: "巴利《相应部》SN 45.8",
          quote: "Yaṁ kho, bhikkhave, dukkhe ñāṇaṁ, dukkhasamudaye ñāṇaṁ, dukkhanirodhe ñāṇaṁ, dukkhanirodhagāminiyā paṭipadāya ñāṇaṁ—ayaṁ vuccati, bhikkhave, sammādiṭṭhi.",
          href: "/jingzang/samyutta-nikaya-sn45/008-sn45-8-0001-0044#sn45.8:3.2",
          source: "SuttaCentral SN 45.8",
          locator: "sn45.8:3.2–3.3",
          relation: "直接",
        }),
      ],
    });
  }

  if (
    has(
      "四圣谛",
      "四聖諦",
      "四谛",
      "四諦",
      "苦集灭道",
      "苦集滅道",
      "cattāri ariyasaccāni",
      "cattari ariyasaccani",
      "four noble truths",
      "Four Noble Truths",
    )
    || sourceHas(
      "苦聖諦當知",
      "苦圣谛当知",
      "苦集聖諦當知、當斷",
      "苦集圣谛当知、当断",
      "苦滅聖諦當知、當證",
      "苦灭圣谛当知、当证",
      "苦滅道跡聖諦當知、當修",
      "苦灭道迹圣谛当知、当修",
      "三轉十二行",
      "三转十二行",
      "Idaṁ kho pana, bhikkhave, dukkhaṁ ariyasaccaṁ",
      "Idaṁ kho pana, bhikkhave, dukkhasamudayaṁ ariyasaccaṁ",
      "Idaṁ kho pana, bhikkhave, dukkhanirodhaṁ ariyasaccaṁ",
      "Idaṁ kho pana, bhikkhave, dukkhanirodhagāminī paṭipadā ariyasaccaṁ",
      "pariññeyyan’ti",
      "pahātabban’ti",
      "sacchikātabban’ti",
      "bhāvetabban’ti",
    )
  ) {
    return finish({
      query,
      status: "有充分来源",
      title: "四圣谛不是四句悲观结论，而是知苦、断集、证灭、修道的四项任务",
      answer: [
        "《杂阿含经》把四谛分别落在动作上：苦圣谛当知、当解，苦集圣谛当断，苦灭圣谛当证，苦灭道迹圣谛当修。若只说“人生是苦”，就删掉了同一段里的集、灭、道，也删掉了改变与修习。",
        "同卷经文进一步把四谛展开为三转十二行：先认识这是一谛，再知道这项任务应当完成，最后说明任务已经完成。能背出“苦集灭道”，不等于知、断、证、修已经发生。",
        "巴利 SN 56.11 也分别界定苦、苦集、苦灭与导向苦灭的道路，并用 pariññeyya、pahātabba、sacchikātabba、bhāvetabba 标出应遍知、应舍断、应证得、应修习。实践上可从一个具体苦开始，分别问：事实是什么、什么条件令它续起、何谓止息、下一项可修的道路是什么。",
      ],
      caution:
        "这里并读《杂阿含经》与巴利《相应部》的相关结构，但不据此硬判它们是已经审定的一一平行经；巴利文中文均为本站工作释义，也不替代后世论典、宗派教判、医疗或心理危机支持。",
      concept: fourNobleTruthsConcept,
      evidence: [
        inlineEvidence({
          label: "《杂阿含经》T0099",
          quote: "若比丘於苦聖諦當知、當解，於苦集聖諦當知、當斷，於苦滅聖諦當知、當證，於苦滅道跡聖諦當知、當修。",
          href: "/jingzang/zaahanjing/015-0104b#T0099.015.0104b15",
          source: "CBETA T02n0099",
          locator: "T0099.015.0104b15–18",
          relation: "直接",
        }),
        inlineEvidence({
          label: "《杂阿含经》T0099",
          quote: "此苦聖諦，本所未曾聞法，當正思惟。……苦集聖諦已知當斷……苦滅聖諦已知當作證……苦滅道跡聖諦已知當修。",
          href: "/jingzang/zaahanjing/015-0103c#T0099.015.0103c14",
          source: "CBETA T02n0099",
          locator: "T0099.015.0103c14–0104a08",
          relation: "直接",
        }),
        inlineEvidence({
          label: "巴利《相应部》SN 56.11",
          quote: "Idaṁ kho pana, bhikkhave, dukkhaṁ ariyasaccaṁ … dukkhasamudayaṁ ariyasaccaṁ … dukkhanirodhaṁ ariyasaccaṁ … dukkhanirodhagāminī paṭipadā ariyasaccaṁ.",
          href: "/jingzang/samyutta-nikaya-sn56/011-sn56-11-0001-0060#sn56.11:4.1",
          source: "SuttaCentral SN 56.11",
          locator: "sn56.11:4.1–10",
          relation: "直接",
        }),
        inlineEvidence({
          label: "巴利《相应部》SN 56.11",
          quote: "Dukkhaṁ ariyasaccaṁ pariññeyyaṁ … dukkhasamudayaṁ ariyasaccaṁ pahātabbaṁ … dukkhanirodhaṁ ariyasaccaṁ sacchikātabbaṁ … dukkhanirodhagāminī paṭipadā ariyasaccaṁ bhāvetabbaṁ.",
          href: "/jingzang/samyutta-nikaya-sn56/011-sn56-11-0001-0060#sn56.11:5.2",
          source: "SuttaCentral SN 56.11",
          locator: "sn56.11:5.2 · 6.2 · 7.2 · 8.2",
          relation: "直接",
        }),
      ],
    });
  }

  if (
    has(
      "缘起",
      "緣起",
      "因缘法",
      "因緣法",
      "十二因缘",
      "十二因緣",
      "paṭiccasamuppāda",
      "idappaccayatā",
    )
    || sourceHas("此有故彼有", "此生故彼生", "此無故彼無", "此滅故彼滅", "法住法界")
  ) {
    return finish({
      query,
      status: "有充分来源",
      title: "缘起不是宿命，而是同时看见条件怎样生起、怎样止息",
      answer: [
        "《杂阿含经》把两面放在同一段：一面是“此有故彼有，此生故彼生”，另一面是“此无故彼无，此灭故彼灭”。若只保留生起而删掉止息，就会把经文误读成单向决定论。",
        "同经另一段先说因缘法，再另说缘生法；这提醒我们区分条件关系与由条件而生、会衰灭的诸支，而不是把“缘起”当成一个固定实体。",
        "巴利《相应部》以 idappaccayatā 与 paṭiccasamuppāda 说明这种条件性，并在 SN 12.15 把生灭链放在避开“一切有／一切无”两端的中道语境里。实践起点不是猜测神秘因缘，而是核对：此刻哪些条件正在延续苦，哪些条件可以停止。",
      ],
      caution:
        "这里并读《杂阿含经》与巴利《相应部》的相关表达，但不据此硬判它们是已经审定的一一平行经；巴利文中文均为本站工作释义，也不替代后世论典与宗派解释。",
      concept: dependentOriginationConcept,
      evidence: [
        inlineEvidence({
          label: "《杂阿含经》T0099",
          quote: "此有故彼有，此生故彼生，謂緣無明有行，乃至生、老、病、死、憂、悲、惱、苦集；所謂此無故彼無，此滅故彼滅。",
          href: "/jingzang/zaahanjing/010-0067a#T0099.010.0067a05",
          source: "CBETA T02n0099",
          locator: "T0099.010.0067a05–08",
          relation: "直接",
        }),
        inlineEvidence({
          label: "《杂阿含经》T0099",
          quote: "云何為因緣法？謂此有故彼有……云何緣生法？謂無明、行。若佛出世，若未出世，此法常住，法住法界。",
          href: "/jingzang/zaahanjing/012-0084b#T0099.012.0084b14",
          source: "CBETA T02n0099",
          locator: "T0099.012.0084b14–24",
          relation: "直接",
        }),
        inlineEvidence({
          label: "巴利《相应部》SN 12.20",
          quote: "Uppādā vā tathāgatānaṁ anuppādā vā tathāgatānaṁ, ṭhitāva sā dhātu dhammaṭṭhitatā dhammaniyāmatā idappaccayatā. … Ayaṁ vuccati, bhikkhave, paṭiccasamuppādo.",
          href: "/jingzang/samyutta-nikaya-sn12/020-sn12-20-0001-0064#sn12.20:2.3",
          source: "SuttaCentral SN 12.20",
          locator: "sn12.20:2.3 · 3.16–17",
          relation: "直接",
        }),
        inlineEvidence({
          label: "巴利《相应部》SN 12.15",
          quote: "‘Sabbamatthī’ti kho, kaccāna, ayameko anto. ‘Sabbaṁ natthī’ti ayaṁ dutiyo anto. Ete te, kaccāna, ubho ante anupagamma majjhena tathāgato dhammaṁ deseti.",
          href: "/jingzang/samyutta-nikaya-sn12/015-sn12-15-0001-0024#sn12.15:3.1",
          source: "SuttaCentral SN 12.15",
          locator: "sn12.15:3.1–9",
          relation: "相关",
        }),
      ],
    });
  }

  if (
    has("无我", "無我", "我所", "无我义", "無我義", "补特伽罗", "補特伽羅", "身无我", "身無我")
    || sourceHas("色不是我", "悉皆無我", "無有我及以我所", "周遍內外，不見本性")
  ) {
    return finish({
      query,
      status: "有充分来源",
      title: "无我不是否认经验，而是不把身心执为固定主宰",
      answer: [
        "《佛说五蘊皆空经》先把问题落在五蕴：色、受、想、行、识并不听命于“我欲如是”，因此不应被执成可以随意支配的“我”。",
        "《外道问圣大乘法无我义经》进一步把身体部件与内外观察逐层拆开：遍看身心结构，也找不到一个能被固定指认的主宰者。无我要拆的是执取方式，不是把经验整段删掉。",
        "实践上，更稳妥的读法是：看见感受、身份、成败和关系如何被抓成“我”或“我所有”，再把这种抓取松开，而不是借“无我”逃避责任。",
      ],
      caution:
        "这里仅依据《佛说五蘊皆空经》《外道问圣大乘法无我义经》与一条相关巴利段落说明最低限度边界，不替所有传统裁决“无我”的最终定义。",
      concept: nonSelfConcept,
      evidence: [
        inlineEvidence({
          label: "《佛说五蘊皆空经》T0102",
          quote: "汝等當知，色不是我，若是我者，色不應病及受苦惱。……是故當知，色不是我；受想行識，亦復如是。",
          href: "/jingzang/taisho-t0102/001-0499c#T0102.001.0499c10",
          source: "CBETA T02n0102",
          locator: "T0102.001.0499c10",
          relation: "直接",
        }),
        inlineEvidence({
          label: "《佛说五蘊皆空经》T0102",
          quote: "凡所有色，若過去未來現在，內外麁細，若勝若劣、若遠若近，悉皆無我。……觀此五取蘊，知無有我及以我所。",
          href: "/jingzang/taisho-t0102/001-0499c#T0102.001.0499c18",
          source: "CBETA T02n0102",
          locator: "T0102.001.0499c18",
          relation: "直接",
        }),
        inlineEvidence({
          label: "《外道问圣大乘法无我义经》T0846",
          quote: "當觀全身，髮、甲、皮、毛、兩手、雙足，至於脂、筋、脾、腸、骨髓等事，周遍內外，不見本性。",
          href: "/jingzang/taisho-t0846/001-0934b#T0846.001.0934b01",
          source: "CBETA T17n0846",
          locator: "T0846.001.0934b01",
          relation: "直接",
        }),
        inlineEvidence({
          label: "巴利《相应部》SN 35.85",
          quote: "Yasmā ca kho, ānanda, suññaṁ attena vā attaniyena vā tasmā suñño lokoti vuccati.",
          href: "/jingzang/samyutta-nikaya-sn35/068-sn35-85-0001-0013#sn35.85:1.4",
          source: "SuttaCentral SN 35.85",
          locator: "sn35.85:1.4",
          relation: "相关",
        }),
      ],
    });
  }

  if (
    has("无常", "無常", "老病死", "生者皆归死", "生者皆歸死", "一切有为法", "一切有爲法")
    || sourceHas("生者皆歸死", "未曾有一事，不被無常吞", "色是無常", "一切有爲法")
  ) {
    return finish({
      query,
      status: "有充分来源",
      title: "无常不是悲观口号，而是如实看见生灭与衰变",
      answer: [
        "《佛说无常经》把无常直接放在衰变、病苦和死亡上：生者归死，容颜变衰，没有一件条件事物能完全逃过败坏。",
        "但经文没有让人停在悲观里。它紧接着劝人“諦聽真實法”“當行不死門”，说明看见无常的目的，是松开执取、改走离苦之路，而不是把自己压垮。",
        "《佛说五蘊皆空经》又把无常带回五蕴：身体、感受、想法和识别活动都不常住。这样理解，无常就不只是谈死亡，也是在修正你当下的抓取方式。",
      ],
      caution:
        "这里主要依据《佛说无常经》与《佛说五蘊皆空经》说明最低限度边界；《佛说无常经》后段的临终劝导与仪轨，不应自动推广成所有传统的共同做法。",
      concept: impermanenceConcept,
      evidence: [
        inlineEvidence({
          label: "《佛说无常经》T0801",
          quote: "生者皆歸死，容顏盡變衰；強力病所侵，無能免斯者。……未曾有一事，不被無常吞。",
          href: "/jingzang/taisho-t0801/001-0745b#T0801.001.0745b24",
          source: "CBETA T17n0801",
          locator: "T0801.001.0745b24",
          relation: "直接",
        }),
        inlineEvidence({
          label: "《佛说无常经》T0801",
          quote: "是故勸諸人，諦聽真實法，共捨無常處，當行不死門。佛法如甘露，除熱得清涼，一心應善聽，能滅諸煩惱。",
          href: "/jingzang/taisho-t0801/001-0745c#T0801.001.0745c11",
          source: "CBETA T17n0801",
          locator: "T0801.001.0745c11",
          relation: "直接",
        }),
        inlineEvidence({
          label: "《佛说五蘊皆空经》T0102",
          quote: "復次苾芻！於汝意云何？色為是常？為是無常？」白言：「大德！色是無常。」",
          href: "/jingzang/taisho-t0102/001-0499c#T0102.001.0499c14",
          source: "CBETA T02n0102",
          locator: "T0102.001.0499c14",
          relation: "直接",
        }),
        inlineEvidence({
          label: "《金刚般若波罗蜜经》T0235",
          quote: "一切有爲法，如夢幻泡影，如露亦如電，應作如是觀。",
          href: "/jingzang/jingangjing/001-0752c#T0235.001.0752c17",
          source: "CBETA T08n0235",
          locator: "T0235.001.0752c17",
          relation: "相关",
        }),
      ],
    });
  }

  if (
    has("空", "五蕴", "心经", "执着", "执著")
    || sourceHas("照見五蘊皆空", "五蘊皆空", "色不異空", "色即是空", "諸法空相")
  ) {
    return finish({
      query,
      status: "有充分来源",
      title: "“空”不是虚无，而是不把因缘所生误认为固定自性",
      answer: [
        "《心经》先从五蕴切入：身体、感受、表象、意志活动与识别活动都应被如实观察，而不是被当作永恒不变的“我”。",
        "“色即是空”并不要求否定生活，而是提醒我们：一切经验都依赖条件而显现。看见这种依存性，执取便有松动的可能。",
        "实践上，可以从当下最强烈的一种感受开始，观察它如何出现、变化和消退；这比把“空”当成抽象口号更接近经文的方向。",
      ],
      caution:
        "不同佛教传统对空义的论证层次和术语解释并不完全相同。这里仅依据当前已登记的汉译般若经典给出入门说明。",
      concept: emptinessConcept,
      evidence: [
        evidenceFor("xinjing", 0),
        evidenceFor("xinjing", 1),
        evidenceFor("jingangjing", 0, "相关"),
      ].filter((item): item is Evidence => item !== null),
    });
  }

  if (
    has("烦恼", "情绪", "痛苦", "焦虑", "心")
    || sourceHas("心為法本", "心尊心使", "惡念而行", "善念而行")
  ) {
    return finish({
      query,
      status: "来源存在分歧",
      title: "先看清心如何带动语言与行动，再谈离苦",
      answer: [
        "汉译《法句经》把心放在行为链条的开端：念头会影响语言和行动，反复的语言与行动又形成可经验的苦乐后果。",
        "这不等于“所有痛苦都只是想出来的”。疾病、暴力、贫困和创伤都有真实条件，佛法的修心不能替代医疗、法律或社会支持。",
        "较稳妥的起点是：暂停自动反应，辨认此刻的身体感受、念头和行动冲动，再选择一个减少伤害的下一步。",
      ],
      caution:
        "此回答不是医疗或心理危机建议。若你正处于危险或强烈痛苦中，请优先联系当地紧急服务和可信赖的专业人员。",
      concept: observingMindConcept,
      evidence: [
        evidenceFor("fajujing", 0),
        evidenceFor("fajujing", 1),
        evidenceFor("xinjing", 0, "相关"),
      ].filter((item): item is Evidence => item !== null),
    });
  }

  if (
    has("无住", "金刚经", "如梦", "有为法", "发心")
    || sourceHas("應無所住而生其心", "如夢幻泡影")
  ) {
    return finish({
      query,
      status: "有充分来源",
      title: "无住不是消极不做，而是不以占有心行动",
      answer: [
        "《金刚经》的“应无所住而生其心”把两个方向放在同一句中：不住著，同时仍然生起利益众生之心。",
        "因此，无住不是逃离责任，也不是压抑感情；它质疑的是把行动成果、身份和功德牢牢归为“我所有”的倾向。",
        "经末以梦、幻、泡、影等譬喻提醒我们看见有为法的短暂与条件性。理解无常，是更清醒地行动，而不是拒绝行动。",
      ],
      caution:
        "本说明聚焦鸠摩罗什译本的可见段落；其他汉译本及梵文本的措辞差异尚未在首版中展开。",
      concept: nonAbidingConcept,
      evidence: [
        evidenceFor("jingangjing", 1),
        evidenceFor("jingangjing", 3),
        evidenceFor("jingangjing", 0, "相关"),
      ].filter((item): item is Evidence => item !== null),
    });
  }

  if (sourceContext) {
    return finish({
      query,
      status: "未找到可靠来源",
      title: "原文已锁定，解释证据仍不足",
      answer: isInitialPassageQuestion
        ? [
            `你所问的内容已锁定到${sourceContext.workTitle}的稳定坐标 ${sourceContext.locator}，下方第一张证据卡就是选中的原文，不会被系统暗中替换。`,
            "当前可信原型尚未为这段登记经过审核的解释。锁定原文只能证明文字和出处，不能自动证明某一种解释；请先打开前后文，或改问一个更具体的术语。",
          ]
        : [
            `你的追问仍与${sourceContext.workTitle}的稳定坐标 ${sourceContext.locator} 保持关联，但回答只按这次明确输入的问题检索。`,
            "当前可信原型尚未为这个追问登记足够证据。所选原文只保留为可核对的上下文，不会被冒充为问题答案；请打开前后文，或换用更具体的经名、术语或句子。",
          ],
      caution:
        "这里没有补写经义，也没有把平台推断标成佛说。解释范围扩大前，系统只保留原文、出处与可继续核对的路径。",
      evidence: [],
    });
  }

  return finish({
    query,
    status: query ? "未找到可靠来源" : "仅找到间接资料",
    title: query ? "当前经藏样本尚不足以可靠回答这个问题" : "从一个真实问题开始",
    answer: query
      ? [
          "可信系统的第一责任不是填满空白，而是知道何时停下。当前公开原型只登记了少量校验样本，不能据此生成看似完整的佛学结论。",
          "你可以换用更具体的经名、术语或句子检索，也可以先进入经藏阅读已登记文本。随着来源和评测通过，回答范围会逐步扩大。",
        ]
      : [
          "试着问：“佛教里的空是什么意思？”、“无住是不是消极？”或“烦恼来时如何观察自己的心？”",
          "首版只在已登记文本范围内回答，并把每一项证据放在结论旁边。",
        ],
    caution:
      "未找到来源不代表佛典中不存在相关教导，只代表当前索引无法支持可靠结论。",
    evidence: query
      ? []
      : [evidenceFor("xinjing", 0, "相关")].filter(
          (item): item is Evidence => item !== null,
        ),
  });
}
