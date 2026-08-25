# foxue.ai 灾难恢复与百年交接手册

本手册是 foxue.ai 在原维护团队、代码托管、部署平台或域名服务不可用时的恢复入口。目标不是假设任何供应商能存在 100 年，而是确保每一层都可替换、每一份关键资产都可验证、下一代维护者不依赖口述记忆。

## 1. 恢复目标

| 资产 | 恢复点目标（RPO） | 恢复时间目标（RTO） | 最低副本 |
|---|---:|---:|---:|
| 源码与治理文档 | 每次主分支提交 | 4 小时 | Git 历史、不可变 Release、Software Heritage、离线介质 |
| GBCR 登记册与快照 | 每个版本 | 4 小时 | Git 历史、对象存储、离线介质 |
| 经藏不可变发布对象 | 每个版本 | 24 小时 | R2、离线发布包、仓库内受控原文 |
| 只读经典阅读站 | 最近稳定发布 | 24 小时 | 可从源码独立构建 |
| 域名与 DNS | 最近导出的受控配置 | 4 小时 | 注册商账户、加密离线记录、继任托管 |
| 用户数据（未来） | 24 小时以内 | 24 小时 | 加密备份；当前版本尚无账户数据 |

“3-2-1”是最低线：至少 3 份副本、2 种介质、1 份异地。GitHub Actions 工件会过期，只能作为临时副本。

## 2. 保存包内容

运行：

```bash
pnpm preserve
```

输出目录 `artifacts/preservation/<commit>/` 包含：

- `*-source.tar`：该提交的干净源码、文档和受控数据；
- `*-history.bundle`：可克隆的 Git 历史；
- `preservation-manifest.json`：提交、时间、大小、关键资产和 SHA-256；
- `SHA256SUMS`：逐文件完整性校验。

源码归档同时包含语料发布器、逐对象校验器、只读 Worker、R2 配置和本手册。生成后的 `artifacts/corpus-release/` 不直接进入 Git；它必须从受控原文与发布脚本确定性重建并复核。

保存包不包含 `.env`、访问令牌、平台密钥、用户数据或未经许可的第三方全文。

### 2.1 GBCR v6.22 公开恢复基线

当前受 GitHub Release Immutability 保护的公开恢复基线是 [`gbcr-v6.22.0`](https://github.com/weitzu-com/foxue.ai/releases/tag/gbcr-v6.22.0)，精确对应提交 `168c78e0ca1f7413dc17937c00027aceee4e9d2b`。主归档为 `foxue-ai-preservation-gbcr-v6.22.0-168c78e0ca1f.tar.zst`，大小 470,688,854 字节，SHA-256 为 `4117dd352606f1f5268e97df0802057ccab1a23c1ae1b2ed62c20ed8b11ca45c`。GitHub 的发行证明同时绑定注释标签对象、提交和四项资产摘要；这条链独立于 30 天后会过期的 Actions 工件。首个不可变基线 `gbcr-v6.18.0` 保留为历史恢复证据。

从公开 Release 恢复并验证：

```bash
gh release download gbcr-v6.22.0 --repo weitzu-com/foxue.ai
gh release verify gbcr-v6.22.0 --repo weitzu-com/foxue.ai
shasum -a 256 -c RELEASE-SHA256SUMS
zstd -t foxue-ai-preservation-gbcr-v6.22.0-168c78e0ca1f.tar.zst
gh release verify-asset gbcr-v6.22.0 foxue-ai-preservation-gbcr-v6.22.0-168c78e0ca1f.tar.zst --repo weitzu-com/foxue.ai
zstd -dc foxue-ai-preservation-gbcr-v6.22.0-168c78e0ca1f.tar.zst | tar -xf -
cd 168c78e0ca1f
shasum -a 256 -c SHA256SUMS
git init --bare bundle-check.git
git -C bundle-check.git bundle verify ../foxue.ai-168c78e0ca1f-history.bundle
```

Software Heritage 的仓库 Origin SWHID 是 `swh:1:ori:5a6f589df03f216f92122303aa0a427521e77e24`。v6.22 基线保存请求 [`2452194`](https://archive.softwareheritage.org/api/1/origin/save/2452194/) 已以 `succeeded/full` 完成，对应完整快照 [`swh:1:snp:0add4f1457ddf7634cca36714eddee9b7d17a077`](https://archive.softwareheritage.org/api/1/snapshot/0add4f1457ddf7634cca36714eddee9b7d17a077/)，其中 `main` 固定到 `168c78e0ca1f7413dc17937c00027aceee4e9d2b`，并包含 `gbcr-v6.22.0` 注释标签。仓库 webhook `666408348` 仅订阅 `push`，以 JSON 和 TLS 证书校验模式调用 Software Heritage 官方 GitHub 接收端；首次 ping 返回 200。`pnpm verify:preservation-mirrors` 与每日 `preservation-mirrors-health.yml` 必须同时证明不可变 Release、发行证明和这份 Software Heritage 完整快照存在。Software Heritage 保存 Git 仓库对象，不替代 Release 二进制、R2、机构副本或离线介质。

## 3. 从零恢复代码

先核验：

```bash
shasum -a 256 -c SHA256SUMS
git bundle verify foxue.ai-*-history.bundle
```

从 Git 历史恢复：

```bash
git clone foxue.ai-*-history.bundle foxue.ai
cd foxue.ai
corepack enable
pnpm install --frozen-lockfile
pnpm verify
pnpm test:e2e
pnpm build
```

若 Git 工具不可用，可直接解开 `source.tar`。运行环境以 `package.json` 的 Node 与 pnpm 版本为准；当前基线是 Node 22.x 和 pnpm 11.16.0。

## 4. 恢复 GBCR 与佛典数据

1. 核对 `data/gbcr/checksums-v6.18.0.sha256`、`data/gbcr/checksums-v6.17.0.sha256`、`data/gbcr/checksums-v6.16.0.sha256`、`data/gbcr/checksums-v6.15.0.sha256`、`data/gbcr/checksums-v6.14.0.sha256` 与 `data/gbcr/checksums-cbeta-v4.23.0.sha256`；历史版本不得被覆盖。
2. 运行 `pnpm verify:corpus`、`pnpm verify:derge`、`pnpm verify:gbcr:v6.15`、`pnpm verify:gbcr:v6.16`、`pnpm verify:buddha-word-scope`、`pnpm verify:gbcr:v6.17`、`pnpm verify:global-denominator-governance` 与 `pnpm verify:gbcr:v6.18`，验证登记册结构、固定来源、权利状态、1,223 个德格可逆切片、272 个古汉译 root、3,377 部作品范围分类、30,797 条冻结候选、七类外部来源空白、3,377 项双重复核队列和统计纪律。治理账本必须保持 0 项自动分母变更；前两项德格离线审计不要求上游仓库仍在线；如另有固定 Esukhia 检出，可设置 `DERGE_KANGYUR_DIR` 后运行 `pnpm verify:derge:upstream` 复算上游提交、tree 与全部输出。
3. 有网络时运行 `pnpm verify:upstream-snapshots`，从固定提交复算 CBETA、SuttaCentral 候选路径摘要，以及 T01–T17 的 881 条汉译经藏逐文件路径、Git 对象哈希和字节数；将同一固定 CBETA 提交检出到本地并设置 `CBETA_XML_P5_DIR` 后，依次运行 `pnpm verify:cbeta:t18-snapshot` 至 `pnpm verify:cbeta:t55-snapshot`，再运行 `pnpm verify:cbeta:t85-snapshot`，复算 T18–T55 与 T85 各固定来源记录、字节数和 Git blob。其余运行 BDRC、梵文、GRETIL、rKTs、跨目录、汉—巴关系、双人复核队列与 P0 审前证据包的既有验证命令。所有项目都必须保持双人独立复核、分歧仲裁和 0 自动归并；未决连接不得自动合并作品或改变全球分母。
4. 运行 `pnpm verify:cbeta-catalog`、`pnpm verify:cbeta:t85-snapshot`、`pnpm audit:cbeta:t85`、`pnpm verify:suttacentral-catalog`、`pnpm verify:suttacentral-dn-catalog`、`pnpm verify:suttacentral-mn-catalog`、`pnpm verify:suttacentral-sn-catalog`、`pnpm verify:suttacentral-an-catalog`、`pnpm verify:suttacentral-kn-catalog`、`pnpm verify:suttacentral:indic`、`pnpm verify:suttacentral:vinaya`、`pnpm verify:suttacentral:abhidhamma`、`pnpm verify:suttacentral:lzh`、`pnpm verify:suttacentral-lzh-catalog`、`pnpm verify:corpus-catalog`、`pnpm verify:parallel-reader-index` 与 `pnpm verify:cbeta-pilot`，核对受控批次、3,875 个文本表达或见证（其中 3,829 个完整全文表达或版本见证）、2,471 个 CBETA TEI 来源资产、1,122 个 Esukhia 德格顶层完整表达、5,764 个 SuttaCentral 巴利经藏、422 个巴利律藏、1,102 个巴利论藏、24 个梵文与俗语及 272 个古汉译 JSON 来源资产。古汉译批次必须保持 4 个完整表达、3 个局部见证、7 个既有作品和 0 个新增作品。
5. 运行 `pnpm build:corpus-release` 和 `pnpm verify:corpus-release`，确定性重建版本清单、作品索引、逐版页对象与 SHA-256 清单。
6. 不得把候选文件数升级为作品分母；Work、Expression 与 Witness 的人工裁决日志必须随下一版登记册保存。
7. 未保存的第三方全文从权利允许的原始来源重建；不能证明许可时，只恢复目录与来源链接。

## 5. 恢复网站

平台无关的最低恢复方式：在任意支持 Node 22 的环境执行 `pnpm build` 和 `pnpm start`。当前生产平台是 Vercel，但代码不依赖专有运行时即可阅读 3,829 个受控完整全文表达或版本见证、46 个节译、后分、节本、短本、残篇、组件、局部、分离、版本或已知缺文见证与覆盖登记册。

Vercel 恢复顺序：

1. 新建 Next.js 项目并连接恢复后的 Git 仓库；
2. 生产分支设为 `main`，Node 设为 22.x；
3. 设置 `NEXT_PUBLIC_SITE_URL=https://www.foxue.ai`；经藏边缘层尚未恢复时不要设置 `CORPUS_ASSET_BASE_URL`，网站会使用仓库内受控原文；
4. 部署后验证 `/api/health`、`/api/v1/corpus/coverage`、`/fugai`、`/shenjiao` 的 80 项只读裁决队列与 P0/P1 筛选、`/sitemap/0.xml` 至 `/sitemap/4.xml`、汉文代表页、T18 的 T0848/T0917 及版本见证 T0893a/T0893c、T19 的 T0924A/T0983B/T1027b、T0945 争议署名边界与 T0946 原始卷号 1/2/4/5、T20 的 T1057a/T1111/T1120B/T1156B/T1185B、T21 的 T1222a/T1276/T1361/T1383/T1419/T1420、T22 的 T1421/T1422a/T1429/T1431/T1432/T1434、T23 的 T1435/T1437/T1438/T1439/T1440/T1442/T1447、T24 的 T1448/T1467a/T1467b/T1482/T1483a/T1484/T1489/T1501、T25 的 T1505/T1506/T1509/T1510a/T1510b/T1511/T1512/T1513/T1514/T1517/T1518、T26 的 T1519/T1520/T1521/T1522/T1529/T1535/T1536/T1537/T1541/T1542/T1543/T1544、T27 的 T1545 首尾版页及《发智论》根本论—广释关系、T31 的 T1585/T1586/T1587、T1592/T1595/T1598、T1602/T1603、T1615、T1626/T1627 及其根本论—注释—组成部分边界、T32 的 T1628/T1629、T1652/T1653、T1666/T1667/T1668、T1669、T1670A/T1670B、T1672–T1674、T1677/T1678、T1685 与 T1692 及其异译、异本、释论、音写、汉地撰成和“佛说”题名边界、巴利《法句经》首尾锚点、《长部》DN1/DN34、《中部》MN1/MN152、《相应部》SN1/SN56、《增支部》AN1/AN11，以及《小部》的 KP、SNP、JA 与后期文本代表锚点；
   另需验证 T33 的 T1693、T1701/T1702、T1705/T1706、T1712/T1713、T1716/T1717 首尾版页，以及根本经、直接注疏、讲说记录、治定本、合注与四组再注释关系保持分层。
   另需验证 T34 的 T1718/T1719、T1723/T1724、T1726/T1727、T1728/T1729 与 T1730 首尾版页；四组注释—再注释、T0262 第二十五品的章节范围，以及 T0273 来源争议与 T1730 论释责任必须保持分层。
   另需验证 T35 的 T1731–T1735 首尾版页；T1731–T1734 与 T0278 六十卷本、T1735 与 T0279 八十卷本，以及 T1735 与下一卷 T1736 的疏—再注释关系必须保持分层。
   另需验证 T36 的 T1736–T1743 首尾版页；T0279 八十卷根经、T1735 直接经疏、T1736 再注释，以及澄观 T1736–T1738、李通玄 T1739–T1741 的同作者不同体例作品必须保持分层，T1742 观门骨目与 T1743 宫廷讲义不得冒充根经表达。
   另需验证 T37 的 T1744–T1764 首尾版页；T0353、T0360、T0365、T0366、T0374 与 T0375 根经必须和所释经疏分层，T1750 智顗说疏与 T1751 妙宗钞保持注疏—再注释关系，T1745/T1746 与 T1757/T1758 保持同题或同作者异作边界，T1763 集解不得冒充南本根经表达。
   另需验证 T38 的 T1765–T1782 首尾版页；T0375、T0450、T0452/T0454/T0456、T0475/T0476 根经必须和所释经疏分层，T1765/T1766 与 T1778/T1779 保持注释—再注释关系，T1774 作为一个多根经注疏作品不得复制计数，T1777/T1778 与 T1780/T1781 必须保持相关但不同作品边界。
   另需验证 T39 的 T1783–T1803 首尾版页；14 组根经—注疏、T1783/T1784、T1785/T1786、T1800/T1801 三组直接注释—再注释必须分层，T1796 全经疏与 T1797 仅释第七卷仪轨疏不得合并，T1799 的注疏存在不得反向消除 T0945 的译者与成书争议。
   另需验证 T40 的 T1804–T1820 首尾版页；T1428—T1804—T1805 根本律、行事钞与再注释必须分层，T1806/T1807 的含注戒本与戒本疏不得合并，T1808–T1810 的通用、僧众、尼众羯磨范围不可互换，T1811–T1815 五部梵网戒疏保持异作，T1817 只释末后一颂，T1820 的净源节要与袾宏补注复合责任必须保留。
   另需验证 T41 的 T1821–T1823 首尾版页；T1558 根本论与普光、法宝两部平行唐疏必须分层，T1821/T1822 不得因同释一论或同为三十卷而合并，T1823 兼依 T1558 与 T1560 的颂疏范围必须独立保存。
   另需验证 T42 的 T1824–T1828 首尾版页；T1564、T1568、T1569、T1579 四种根本论必须和五部汉地论疏分层，T1825/T1826 虽同释《十二门论》仍按吉藏、法藏责任和三卷/二卷范围保持两部平行注疏，T1824/T1825/T1827 也不得因同署吉藏和同属三论传统而合并。
   另需验证 T43 的 T1829–T1834 首尾版页；T1579、T1585、T1590 三种根本论必须和六部汉地唯识论疏分层，T1832/T1833 必须保持对 T1830 的两条再注释链，T1830/T1831 必须保持述记与枢要的解释范围边界，T1829/T1830/T1831/T1834 也不得因同署窺基而合并。
   另需验证 T44 的 T1835–T1851 首尾版页；T1600、T1614、T1626/T1627、T1628、T1630、T1666/T1667 必须和十七部汉地或新罗论疏分层，T1836 的窺基注解—普泰增修复合责任、T1848 对 T1846/T1847 法藏义记系统的再注释、T1841/T1842、T1844/T1845、T1846/T1847 的伴随著作范围，以及 T1851 的独立综合义章身份均必须保留。
   另需验证 T45 的 T1852–T1910（含 T1879a/b、T1887A/B）首尾版页；T1858 根本《肇论》与 T1859/T1860 两部疏、T1879a/b 的同经号异作、T1887A 法界图根本与 T1887B 后出集注必须分层，T1879b、T1887B、T1910 的无署名责任不得被补写，同宗派、同作者、题名、引文或文本重叠不得自动合并作品。
   另需验证 T46 的 T1911–T1956 首尾版页；T1911–T1914 根本止观与疏释、T1920/T1921 和 T1927/T1928 根本著作—注疏、T1941–T1944 法华三昧仪轨群及 T1945/T1946 金光明忏仪必须分层，T1943、T1944、T1952、T1953 的无署名责任不得被补写，同宗派、同作者、仪式功能、引文或文本重叠不得自动合并作品。
   另需验证 T47 的 T1957–T2000（含 T1969A/B、T1986A/B、T1987A/B、T1994A/B、T1998A/B）首尾版页；净土同作者异作、礼赞仪轨、五组同数字经号与同一禅师的不同语录必须分层，T1986A/B、T1987A/B 不得因高文本重叠合并，T1994B 的无署名责任不得被补写。
   另需验证 T48 的 T2001–T2025（含 T2002A/B、T2012A/B、T2019A/B）首尾版页；三组同数字经号、《坛经》T2007/T2008 相关传本、玄觉、延寿与知讷同作者异作必须分层，公案材料和清规文类复用不得触发自动合并，T2009 的无署名责任不得被补写。
   另需验证 T49 的 T2026–T2039 首尾版页；T2031–T2033 三部部派论书保持相关而独立，T2034–T2038 的史料复用不得触发自动合并，T2037/T2038 的本编与续集必须分立，T2026/T2028/T2029 的失译责任与 T2039 的 TEI/DILA 责任标签差异必须并列保存。
   另需验证 T50 的 T2040–T2065（含 T2047a/b）首尾版页；T2047a/b 必须保持同一规范作品下的两种完整版本见证，T2040/T2041、T2042–T2045、T2052/T2053、T2059–T2062 及 T2063–T2065 的传记范围、续编、史料复用与相关异作边界不得因共同人物、题名、编纂系列或文本重叠而误并，T2044 的失译责任和 T2057/T2064 的未署名责任不得被推定补写。
   另需验证 T51 的 T2066–T2101 首尾版页；T2067/T2068 两部法华史传、T2076/T2077 灯录本编—续修、T2078–T2080 契嵩伴随著作、T2098–T2100 清凉山方志续修必须保持相关且独立，T2068 的僧詳/僧祥目录责任标签应并列保存，T2070、T2075、T2086、T2091、T2094 的未署名责任不得被推定补写。
   同时验证 T52 的 T2102–T2120 首尾版页；T2102/T2103 护法总集本编—广集、T2104/T2105 佛道论衡本编—续集、T2106/T2107 道宣感通录、T2109/T2110 法琳护法论、T2078–T2080/T2115 契嵩跨卷伴随著作必须保持相关且独立。T2103/T2104 的显著材料重叠只能记录为来源复用，T2113 的神清撰—慧宝注责任必须分层，T2119 不得因题名含玄奘而补造总集编者。
   另需验证 T53 的 T2121/T2122、T54 的 T2123/T2128/T2133A/B/T2139/T2144、T55 的 T2145/T2154/T2168A/B/T2174A/B/T2184，以及 T85 的 T2732/T2764A/B/T2830A/B/T2865/T2917A/B/T2920 首尾版页。T2168A/B 即使共享 DILA 基础号也必须保持两个作品，T2174B 与 T2162、T2175 的未署名责任不得推定补写；T2764A/B、T2830A/B、T2917A/B 和九组同题记录在写本校勘前不得自动合并；全部 T55 与 T85 记录不得标成佛陀逐字亲说。
   最后验证德格 D1 的 `/jingzang/derge-kangyur-d0001/001-0001b#D1.001.0001b01.01`、跨卷表达、单卷表达与最后目录表达 D1108；页面必须显示藏文、函号、德格版页、Public Domain、BDRC 作品链接候选、版本差异和“不自动证明佛陀逐字亲说”边界。站点地图应包含 1,122 个德格表达目录及 66,397 个版页阅读网址。
5. 通过后再切换 DNS，失败则保留原站或静态维护页。

### 5.1 恢复经藏对象存储与只读边缘层

当前设计使用 Cloudflare R2 与 Worker，但对象布局和网站回退均不依赖该供应商。恢复顺序必须是：

截至 2026-08-25 的生产事实：`canon.foxue.ai` 已绑定 `foxue-ai-corpus-edge`，Cloudflare TLS、`/health`、`/ready` 与 `v1/latest.json` 均已从公网验证。Worker 正在从私有 R2 桶 `foxue-ai-corpus` 以只读方式提供当前发行 `gbcr-6.22.0-2b8ab8d5e4fe-eac6c24781dd-a582cf471b7c-cd4264170b73`；`storage=ready`、`preservationReady=true`，公开指针的清单 SHA-256 为 `17754f9d63eedbc9c930d77f86dfe355316e79bbd3a44fbadc9607e749c05391`。Vercel Production 已设置 `CORPUS_ASSET_BASE_URL=https://canon.foxue.ai` 并完成重新部署。此为单一已验证发行与服务状态，不构成全球佛经覆盖率或百年可用性保证。

1. 建立私有对象桶 `foxue-ai-corpus`，配置最小权限的发布凭据；
2. 运行 `pnpm build:corpus-release` 与 `pnpm verify:corpus-release`，记录本次构建输出的发布 ID、清单 SHA-256、对象计数、对象字节数与 `upload-plan.json`；不得把历史 v6.18 的计数或哈希当作后续内容寻址发行的预期值；
3. 在已认证的维护环境运行 `pnpm publish:corpus:r2`。发布器先传不可变对象，重试并核对完成后最后更新 `v1/latest.json`；
4. 运行 `pnpm cloudflare:types:check`、`pnpm cloudflare:check` 与 `pnpm cloudflare:bootstrap:check`，再用 `wrangler deploy --config infra/corpus-edge/wrangler.jsonc` 把现有 bootstrap 版本升级为带 R2 绑定的只读 Worker；
5. 保持 `canon.foxue.ai` 绑定不变，验证 `/health` 与 `/ready` 均为 200、`/v1/latest.json`、代表性作品索引、代表性版页、ETag/304、CORS、404 与写入 405；再运行 `pnpm verify:cloudflare-edge`；
6. 边缘层全部通过后，才在网站生产环境设置 `CORPUS_ASSET_BASE_URL=https://canon.foxue.ai` 并重新部署；
7. 若 R2、Worker 或自定义域名失败，移除该环境变量即可回到本地受控原文，不改变稳定段落 ID 或公开网址。

恢复时不得先写 `v1/latest.json`，也不得覆盖既有版本目录。任何供应商迁移都应保持 `v1/releases/<release-id>/...` 对象键、内容类型、哈希和缓存语义不变。

## 6. 恢复域名、DNS 与 TLS

当前域名由 Cloudflare Registrar 管理；2026-08-16 的 API 审计确认注册锁与自动续费开启、到期时间为 2028-08-05，DNSSEC 为 active（ECDSAP256SHA256 / SHA-256）。apex 与 `www` 以 DNS-only 指向 Vercel，这是避免双重 CDN、缓存冲突与安全信号损失的有意设计；`canon` 是独立 Cloudflare Worker 自定义域名并由 Cloudflare 代理。恢复时：

1. 先确认组织控制的注册邮箱、双因素认证和继任人权限；
2. 核对 apex 与 `www` 指向生产托管目标；
3. 不给 Vercel 的 apex 与 `www` 擅自开启 Cloudflare 代理；若未来更换托管架构，先在独立主机名验证域名所有权、缓存、真实客户端信号和 TLS，再决定是否代理；
4. DNSSEC 迁移必须按“新 DNSKEY → 新 DS → 验证 → 移除旧 DS”的顺序，避免签名中断；
5. 用独立解析器核对 DS、DNSKEY、A/CNAME 与 HTTPS；
6. 不在本仓库记录账户邮箱、恢复码、API 令牌或付款信息。

域名若不可恢复，应启用预先登记的备用域名，并在所有保存包、公共目录和合作机构页面发布迁移声明；旧稳定段落 ID 保持不变。

## 7. 密钥与账户继任

本仓库只记录密钥名称，不记录值。未来至少需要受控保管：GitHub、Vercel、Cloudflare、对象存储、监控和支付账户。每个账户必须有：

- 组织所有权而非个人永久所有权；
- 两名以上受托人和最小权限；
- 硬件安全密钥与密封恢复流程；
- 年度权限复核、离任撤权和继任演练；
- 访问日志与紧急操作的双人复核。

## 8. 恢复演练

- 每次主分支构建：生成保存包并验证 Git bundle。
- 每日：由 `cloudflare-edge-health.yml` 从公网核对权威 DNS、Worker、发行指针、清单哈希、只读门禁与就绪状态。
- 每日：由 `preservation-mirrors-health.yml` 核对不可变 GitHub Release、注释标签目标、四项资产摘要、发行证明与 Software Heritage 快照。
- 每季度：在全新临时环境从保存包恢复、构建并运行测试。
- 每半年：导出 DNS、账户与对象存储清单，验证异地副本可读。
- 每年：由未参与日常维护的人执行完整接管演练，记录用时、失败点与改进项。
- 每五年：迁移一次保存介质与哈希算法策略，保留旧校验并追加新校验。

任何演练都不得在未确认目标时覆盖生产 DNS、删除现有部署或暴露真实密钥。先在隔离环境恢复，验证通过后再执行受控切换。
