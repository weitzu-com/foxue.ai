export function normalizeInstitution(value) {
  return String(value ?? "").normalize("NFKC").trim().toLocaleLowerCase("en-US").replace(/\s+/g, " ");
}

export function hasInstitutionallyIndependentDecisionPair(decisions) {
  const reviewerIds = new Set();
  const institutions = new Set();
  for (const decision of decisions) {
    reviewerIds.add(decision?.reviewerId);
    const institution = normalizeInstitution(decision?.reviewerInstitution);
    if (institution) institutions.add(institution);
  }
  return reviewerIds.size >= 2 && institutions.size >= 2;
}

export function arbitratorIsInstitutionallyIndependent(
  arbitratorInstitution,
  referencedDecisions,
) {
  const normalizedArbitratorInstitution = normalizeInstitution(arbitratorInstitution);
  if (!normalizedArbitratorInstitution) return false;
  return referencedDecisions.every((decision) => (
    normalizeInstitution(decision?.reviewerInstitution) !== normalizedArbitratorInstitution
  ));
}
