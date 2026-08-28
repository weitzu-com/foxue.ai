export type AmituojingLearningDay = {
  id: number;
  title: string;
  focus: string;
  reading: string;
  practice: string;
  context: string;
  versionNote: string;
  segmentId: string;
  locator: string;
  href: string;
  parallelLocator: string;
  parallelHref: string;
};

const amituojingWorkPath = "/jingzang/amituojing";
const xuanzangWorkPath = "/jingzang/taisho-t0367";

function sourceHref(folio: string, segmentId: string) {
  return `${amituojingWorkPath}/${folio}#${segmentId}`;
}

function parallelHref(folio: string, segmentId: string) {
  return `${xuanzangWorkPath}/${folio}#${segmentId}`;
}

export const amituojingLearningDays: AmituojingLearningDay[] = [
  {
    id: 1,
    title: "先从正在说法处开始",
    focus: "今现在说法",
    reading:
      "爾時，佛告長老舍利弗：「從是西方過十萬億佛土，有世界名曰極樂。其土有佛，號阿彌陀，今現在說法。",
    practice:
      "先慢读三遍“今现在说法”。暂不追赶解释，只观察：当下这一刻，心是否愿意停下来听？",
    context:
      "这段在列出与会大众之后开启正说，先交代方所、世界名、佛名与“现在说法”。本路径从经文自己的叙事起点进入，不先用后世概念代替原句。",
    versionNote:
      "玄奘译 T0367 的相关开篇同样交代西方、极乐世界与无量寿佛，但译名和句法不同。下方链接只标示相关段落，不宣称逐词对应。",
    segmentId: "T0366.001.0346c10",
    locator: "T0366.001.0346c10–12",
    href: sourceHref("001-0346c", "T0366.001.0346c10"),
    parallelLocator: "T0367.001.0348c08–13",
    parallelHref: parallelHref("001-0348c", "T0367.001.0348c08"),
  },
  {
    id: 2,
    title: "何故名为极乐",
    focus: "无有众苦",
    reading:
      "舍利弗！彼土何故名為極樂？其國眾生無有眾苦，但受諸樂，故名極樂。",
    practice:
      "读完后停一分钟，不急着想象远方景象。先如实辨认此刻的一种苦受与一种可感的安稳，不压抑，也不夸大。",
    context:
      "经文以自问自答解释世界名，随后铺陈栏楯、罗网、行树与宝池等庄严。本日只抓住经文给出的直接释名，不把整部净土思想压缩成一句定义。",
    versionNote:
      "玄奘译相关段落使用“无有一切身心忧苦，唯有无量清净喜乐”。两译可互相照见，但“众苦／诸乐”与展开后的措辞应各自保留。",
    segmentId: "T0366.001.0346c12",
    locator: "T0366.001.0346c12–14",
    href: sourceHref("001-0346c", "T0366.001.0346c12"),
    parallelLocator: "T0367.001.0348c14–16",
    parallelHref: parallelHref("001-0348c", "T0367.001.0348c14"),
  },
  {
    id: 3,
    title: "让法音进入日常",
    focus: "念佛念法念僧",
    reading:
      "是諸眾鳥，晝夜六時出和雅音，其音演暢五根、五力、七菩提分、八聖道分如是等法。其土眾生聞是音已，皆悉念佛、念法、念僧。",
    practice:
      "今天听见一个日常声音时，以它作为提醒：放下手中动作一息，忆念佛、法、僧各一次，然后再继续生活。",
    context:
      "相关段落先列众鸟与所宣法门，继而说明闻音者念三宝；下文又明确这些鸟并非罪报所生。阅读时应把譬陈与后续说明一起看。",
    versionNote:
      "玄奘译在相关段落列出更长的法目，并用“念佛、念法、念僧，无量功德熏修其身”收束。法目数量与译语差异值得分开核读。",
    segmentId: "T0366.001.0347a14",
    locator: "T0366.001.0347a14–16",
    href: sourceHref("001-0347a", "T0366.001.0347a14"),
    parallelLocator: "T0367.001.0349b04–15",
    parallelHref: parallelHref("001-0349b", "T0367.001.0349b04"),
  },
  {
    id: 4,
    title: "光寿无量",
    focus: "何故号阿弥陀",
    reading:
      "舍利弗！彼佛光明無量，照十方國無所障礙，是故號為阿彌陀。又舍利弗！彼佛壽命及其人民，無量無邊阿僧祇劫，故名阿彌陀。",
    practice:
      "分别读“光明无量”与“寿命无量”。今天只选择其中一个词安住片刻，不把“无量”变成需要想象完成的数字。",
    context:
      "罗什译在连续两问中，以光明无量与寿命无量解释佛名。这里的“阿弥陀”承载两层释名，不能只截取其中一半便当作全段。",
    versionNote:
      "玄奘译把两层释名分别写作“无量寿”“无量光”。这是非常适合并读的译名差异，但仍需沿各自段落理解，不能反向拼改底本文字。",
    segmentId: "T0366.001.0347a26",
    locator: "T0366.001.0347a26–29",
    href: sourceHref("001-0347a", "T0366.001.0347a26"),
    parallelLocator: "T0367.001.0349b29–0349c07",
    parallelHref: parallelHref("001-0349b", "T0367.001.0349b29"),
  },
  {
    id: 5,
    title: "发愿与同会",
    focus: "与诸上善人俱会",
    reading:
      "舍利弗！眾生聞者，應當發願，願生彼國。所以者何？得與如是諸上善人俱會一處。",
    practice:
      "写下一句愿：愿自己今天更靠近怎样的善行、善友与共同生活。让愿落到一个可实践的小动作上。",
    context:
      "本句承接前文“不可以少善根福德因缘得生彼国”，把“应当发愿”与“俱会一处”的理由连在一起。愿并非孤立口号。",
    versionNote:
      "玄奘译相关段落也把愿生与亲近无量诸佛、同一集会相连，展开方式更长。本页只提供相关坐标，不替代整段阅读。",
    segmentId: "T0366.001.0347b07",
    locator: "T0366.001.0347b07–09",
    href: sourceHref("001-0347b", "T0366.001.0347b07"),
    parallelLocator: "T0367.001.0349c27–0350a06",
    parallelHref: parallelHref("001-0349c", "T0367.001.0349c27"),
  },
  {
    id: 6,
    title: "执持名号",
    focus: "一心不乱",
    reading:
      "舍利弗！若有善男子、善女人，聞說阿彌陀佛，執持名號，若一日、若二日、若三日、若四日、若五日、若六日、若七日，一心不亂。",
    practice:
      "选择一个不被打扰的短时段，清楚念持佛号；散乱时只需觉察并回来，不用把“一心”变成新的自我评判。",
    context:
      "本段下文继续叙述临命终时与往生愿。今日引文停在“一心不乱”，不把后续句义省略后又暗中带入解释。",
    versionNote:
      "这里尤其不能抹平：罗什译作“执持名号／一心不乱”，玄奘译相关段落作“闻已思惟／系念不乱”。二者属于同一作品的不同汉译表达，不是可直接互换的词组。",
    segmentId: "T0366.001.0347b10",
    locator: "T0366.001.0347b10–13",
    href: sourceHref("001-0347b", "T0366.001.0347b10"),
    parallelLocator: "T0367.001.0350a07–14",
    parallelHref: parallelHref("001-0350a", "T0367.001.0350a07"),
  },
  {
    id: 7,
    title: "难信之法",
    focus: "五浊恶世",
    reading:
      "舍利弗！當知我於五濁惡世行此難事，得阿耨多羅三藐三菩提，為一切世間說此難信之法，是為甚難！",
    practice:
      "最后一天不以“我是否已经相信”作结。只问：在纷扰与成见中，我是否仍愿意认真听闻、核对并实践一件善法？",
    context:
      "本句位于经末，释迦牟尼佛说明在五浊恶世成道并说难信之法之难。它把全经放回说法者所处的世界，而不是只留下净土图景。",
    versionNote:
      "玄奘译末段用“杂染堪忍世界五浊恶时”与“世间极难信法”展开相近结构。相关坐标可供并读；两段篇幅、语序与用词都不相同。",
    segmentId: "T0366.001.0348a23",
    locator: "T0366.001.0348a23–26",
    href: sourceHref("001-0348a", "T0366.001.0348a23"),
    parallelLocator: "T0367.001.0351b07–10",
    parallelHref: parallelHref("001-0351b", "T0367.001.0351b07"),
  },
];

export const amituojingFullTextHref = amituojingWorkPath;
export const xuanzangAmituojingHref = xuanzangWorkPath;
