const repository = "weitzu-com/foxue.ai";
const releaseTag = "gbcr-v6.22.0";
const releaseCommit = "168c78e0ca1f7413dc17937c00027aceee4e9d2b";
const releaseTagObject = "b045008dc2ac0c07019c3e3de75115007ad9692b";
const softwareHeritageRequestId = 2452194;
const softwareHeritageOrigin = "https://github.com/weitzu-com/foxue.ai.git";
const softwareHeritageSnapshot = "swh:1:snp:0add4f1457ddf7634cca36714eddee9b7d17a077";
const releaseChecksum =
  "4117dd352606f1f5268e97df0802057ccab1a23c1ae1b2ed62c20ed8b11ca45c  foxue-ai-preservation-gbcr-v6.22.0-168c78e0ca1f.tar.zst\n1e7e46013c5b79a0a320a6ec8fa6c7b71ae8acdea5bfae5367f5a2a6d6ab5236  preservation-manifest.json\n7b2b0321de48edb78ff792344be49461763188f81f0659afd3946d3827a8d563  SHA256SUMS\n";

const expectedAssets = new Map([
  [
    "foxue-ai-preservation-gbcr-v6.22.0-168c78e0ca1f.tar.zst",
    {
      size: 470_688_854,
      digest: "sha256:4117dd352606f1f5268e97df0802057ccab1a23c1ae1b2ed62c20ed8b11ca45c",
    },
  ],
  [
    "preservation-manifest.json",
    {
      size: 1_519_476,
      digest: "sha256:1e7e46013c5b79a0a320a6ec8fa6c7b71ae8acdea5bfae5367f5a2a6d6ab5236",
    },
  ],
  [
    "RELEASE-SHA256SUMS",
    {
      size: 292,
      digest: "sha256:5508a223a596a92c3bf1090975adacbb68221147180ca86bcb511d9b953438b9",
    },
  ],
  [
    "SHA256SUMS",
    {
      size: 295,
      digest: "sha256:7b2b0321de48edb78ff792344be49461763188f81f0659afd3946d3827a8d563",
    },
  ],
]);

const failures = [];
const successes = [];

function check(condition, success, failure) {
  if (condition) successes.push(success);
  else failures.push(failure);
}

const githubHeaders = {
  accept: "application/vnd.github+json",
  "user-agent": "foxue-preservation-mirror-check/1.0",
  "x-github-api-version": "2026-03-10",
};
if (process.env.GITHUB_TOKEN) githubHeaders.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

async function request(url, { headers = {}, responseType = "json" } = {}) {
  try {
    const response = await fetch(url, {
      headers: { ...headers },
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) {
      failures.push(`${url} 返回 ${response.status}`);
      return null;
    }
    return responseType === "text" ? response.text() : response.json();
  } catch (error) {
    failures.push(`${url} 请求失败：${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

const releaseApi = `https://api.github.com/repos/${repository}/releases/tags/${releaseTag}`;
const tagRefApi = `https://api.github.com/repos/${repository}/git/ref/tags/${releaseTag}`;
const checksumUrl = `https://github.com/${repository}/releases/download/${releaseTag}/RELEASE-SHA256SUMS`;
const swhRequestApi = `https://archive.softwareheritage.org/api/1/origin/save/${softwareHeritageRequestId}/`;
const swhSnapshotApi = `https://archive.softwareheritage.org/api/1/snapshot/${softwareHeritageSnapshot.slice(-40)}/`;

const [release, tagRef, checksum, swhRequest, swhSnapshot] = await Promise.all([
  request(releaseApi, { headers: githubHeaders }),
  request(tagRefApi, { headers: githubHeaders }),
  request(checksumUrl, { responseType: "text" }),
  request(swhRequestApi),
  request(swhSnapshotApi),
]);

if (release) {
  check(
    release.tag_name === releaseTag && release.draft === false && release.prerelease === false,
    `GitHub Release ${releaseTag} 已公开`,
    `GitHub Release ${releaseTag} 状态异常`,
  );
  check(release.immutable === true, "GitHub Release 已受不可变保护", "GitHub Release 不再不可变");
  check(
    Array.isArray(release.assets) && release.assets.length === expectedAssets.size,
    `Release 资产数量正确（${expectedAssets.size}）`,
    `Release 资产数量异常（${release.assets?.length ?? "缺失"}）`,
  );

  for (const [name, expected] of expectedAssets) {
    const asset = release.assets?.find((candidate) => candidate.name === name);
    check(
      asset?.state === "uploaded" && asset?.size === expected.size && asset?.digest === expected.digest,
      `${name} 大小与 SHA-256 正确`,
      `${name} 缺失或完整性信息漂移`,
    );
  }
}

if (tagRef) {
  check(
    tagRef.object?.type === "tag" && tagRef.object?.sha === releaseTagObject,
    `发行标签为固定注释标签对象 ${releaseTagObject}`,
    "发行标签不是预期的注释标签对象",
  );
  const tag = tagRef.object?.url ? await request(tagRef.object.url, { headers: githubHeaders }) : null;
  if (tag) {
    check(
      tag.tag === releaseTag && tag.object?.type === "commit" && tag.object?.sha === releaseCommit,
      `发行标签固定到 ${releaseCommit}`,
      `发行标签目标漂移（${tag.object?.sha ?? "缺失"}）`,
    );
  }
}

check(checksum === releaseChecksum, "匿名下载校验和正确", "匿名下载校验和不匹配");

if (swhRequest) {
  check(
    swhRequest.id === softwareHeritageRequestId && swhRequest.origin_url === softwareHeritageOrigin,
    `Software Heritage 请求 ${softwareHeritageRequestId} 指向正确仓库`,
    "Software Heritage 请求身份或仓库地址异常",
  );
  check(
    swhRequest.save_request_status === "accepted" &&
      swhRequest.save_task_status === "succeeded" &&
      swhRequest.visit_status === "full",
    "Software Heritage 完整归档已成功",
    `Software Heritage 尚未完整成功（task=${swhRequest.save_task_status ?? "缺失"}, visit=${swhRequest.visit_status ?? "缺失"}）`,
  );
  check(
    swhRequest.snapshot_swhid === softwareHeritageSnapshot,
    `Software Heritage 快照固定为 ${softwareHeritageSnapshot}`,
    `Software Heritage 快照 SWHID 漂移（${swhRequest.snapshot_swhid ?? "缺失"}）`,
  );
}

if (swhSnapshot) {
  check(
    swhSnapshot.id === softwareHeritageSnapshot.slice(-40) && swhSnapshot.next_branch === null,
    `Software Heritage 快照完整列出 ${Object.keys(swhSnapshot.branches ?? {}).length} 个引用`,
    "Software Heritage 快照身份错误或引用列表未完整返回",
  );
  check(
    swhSnapshot.branches?.["refs/heads/main"]?.target_type === "revision" &&
      swhSnapshot.branches?.["refs/heads/main"]?.target === releaseCommit,
    `Software Heritage main 固定到 ${releaseCommit}`,
    `Software Heritage main 目标漂移（${swhSnapshot.branches?.["refs/heads/main"]?.target ?? "缺失"}）`,
  );
  check(
    swhSnapshot.branches?.[`refs/tags/${releaseTag}`]?.target_type === "release" &&
      swhSnapshot.branches?.[`refs/tags/${releaseTag}`]?.target === releaseTagObject,
    `Software Heritage ${releaseTag} 固定到注释标签对象`,
    `Software Heritage ${releaseTag} 目标漂移`,
  );
}

for (const item of successes) console.log(`✓ ${item}`);
for (const item of failures) console.error(`✗ ${item}`);

if (failures.length > 0) process.exitCode = 1;
