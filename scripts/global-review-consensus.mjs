export function normalizeInstitution(value) {
  return String(value ?? "").normalize("NFKC").trim().toLocaleLowerCase("en-US").replace(/\s+/g, " ");
}

export function hasInstitutionallyIndependentPair(reviewerIds, declarationsById) {
  const institutions = new Set();
  for (const reviewerId of reviewerIds) {
    const declaration = declarationsById.get(reviewerId);
    const institution = normalizeInstitution(declaration?.institution);
    if (institution) institutions.add(institution);
  }
  return institutions.size >= 2;
}

export function arbitratorIsInstitutionallyIndependent(
  arbitratorReviewerId,
  referencedReviewerIds,
  declarationsById,
) {
  const arbitratorInstitution = normalizeInstitution(
    declarationsById.get(arbitratorReviewerId)?.institution,
  );
  if (!arbitratorInstitution) return false;
  return referencedReviewerIds.every((reviewerId) => (
    normalizeInstitution(declarationsById.get(reviewerId)?.institution) !== arbitratorInstitution
  ));
}
