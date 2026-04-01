const outcome = (decision, reason) => ({
  type: "outcome",
  decision,
  reason,
});

const linkTo = (next, reason = "") => ({
  type: "next",
  next,
  reason,
});

const question = ({ label, details = [], yes, no }) => ({
  type: "question",
  label,
  details,
  yes,
  no,
});

const createAnteriorInitialTree = (anatomyDetails) => ({
  first: "anatomy",
  nodes: {
    anatomy: question({
      label: "La dent présente-t-elle une particularité anatomique ?",
      details: anatomyDetails,
      yes: outcome("cbct", "Une particularité anatomique est présente."),
      no: linkTo("visibility"),
    }),
    visibility: question({
      label: "La chambre pulpaire ou les canaux sont-ils partiellement visibles ou non visibles ?",
      yes: outcome("cbct", "La visibilité radiographique est insuffisante."),
      no: linkTo("open_apex"),
    }),
    open_apex: question({
      label: "Y a-t-il un apex ouvert de plus de 1 mm ?",
      yes: outcome("cbct", "Un apex ouvert de plus de 1 mm a été identifié."),
      no: linkTo("resorption"),
    }),
    resorption: question({
      label: "Existe-t-il des signes de résorption radiculaire externe ou interne ?",
      yes: outcome("cbct", "Des signes de résorption radiculaire sont présents."),
      no: linkTo("remineralization"),
    }),
    remineralization: question({
      label: "Existe-t-il des signes de reminéralisation ou de radio-opacité dans l’espace canalaire ?",
      yes: outcome("cbct", "Une radio-opacité intracanalaire complique l’analyse 2D."),
      no: linkTo("j_shaped"),
    }),
    j_shaped: question({
      label: "Observe-t-on une lésion en J et/ou un sondage parodontal isolé marqué ?",
      yes: outcome("cbct", "Des signes compatibles avec une lésion complexe sont présents."),
      no: linkTo("periapical"),
    }),
    periapical: question({
      label: "La lésion péri-apicale mesure-t-elle plus de 5 mm de diamètre ?",
      yes: outcome("cbct", "La lésion péri-apicale dépasse 5 mm."),
      no: outcome("no_cbct", "Aucun critère du parcours n’indique un CBCT."),
    }),
  },
});

const createAnteriorRetreatmentTree = () => ({
  first: "ems_considered",
  nodes: {
    ems_considered: question({
      label: "L’EMS (chirurgie endodontique) est-elle envisagée ?",
      details: [
        "Tenon coronaire adapté",
        "Risque majeur à la dépose",
        "Pronostic défavorable pour un traitement orthograde",
      ],
      yes: outcome("cbct", "Une EMS est envisagée."),
      no: linkTo("prior_ems"),
    }),
    prior_ems: question({
      label: "Existe-t-il des signes radiographiques d’une EMS antérieure ?",
      yes: outcome("cbct", "Une EMS antérieure est suspectée."),
      no: linkTo("ledge"),
    }),
    ledge: question({
      label: "Existe-t-il des signes radiographiques de marche, perforation ou stripping, y compris un tenon mal aligné ?",
      yes: outcome("cbct", "Une complication iatrogène est visible sur la radiographie."),
      no: linkTo("separated_instrument"),
    }),
    separated_instrument: question({
      label: "Existe-t-il des signes radiographiques d’un instrument fracturé ?",
      yes: outcome("cbct", "Un instrument fracturé est visible."),
      no: linkTo("treated_open_apex"),
    }),
    treated_open_apex: question({
      label: "Y a-t-il un apex ouvert avec traitement antérieur (apexification, revitalisation...) ?",
      yes: outcome("cbct", "Un apex ouvert après traitement antérieur a été identifié."),
      no: linkTo("resorption"),
    }),
    resorption: question({
      label: "Existe-t-il des signes de résorption radiculaire externe ou interne ?",
      yes: outcome("cbct", "Des signes de résorption radiculaire sont présents."),
      no: linkTo("j_shaped"),
    }),
    j_shaped: question({
      label: "Observe-t-on une lésion en J et/ou un sondage parodontal isolé marqué ?",
      yes: outcome("cbct", "Des signes compatibles avec une lésion complexe sont présents."),
      no: linkTo("all_canals_treated"),
    }),
    all_canals_treated: question({
      label: "Tous les canaux ont-ils été traités jusqu’à la longueur de travail radiographique ?",
      yes: linkTo("periapical"),
      no: linkTo("untreated_canal"),
    }),
    untreated_canal: question({
      label: "Un ou plusieurs canaux sont-ils totalement non traités ?",
      yes: outcome("cbct", "Au moins un canal est totalement non traité."),
      no: linkTo("untreated_visible"),
    }),
    untreated_visible: question({
      label: "Les portions non traitées des canaux sont-elles clairement visibles radiographiquement ?",
      yes: outcome("no_cbct", "Les zones non traitées restent clairement visibles sur l’imagerie 2D."),
      no: outcome("cbct", "Les zones non traitées ne sont pas clairement visibles."),
    }),
    periapical: question({
      label: "La lésion péri-apicale mesure-t-elle plus de 5 mm de diamètre ?",
      yes: outcome("cbct", "La lésion péri-apicale dépasse 5 mm."),
      no: outcome("no_cbct", "Aucun critère du parcours n’indique un CBCT."),
    }),
  },
});

const createUpperMolarInitialTree = () => ({
  first: "anatomy",
  nodes: {
    anatomy: question({
      label: "La dent présente-t-elle une particularité anatomique ?",
      details: [
        "Racines confluentes ou fusionnées (C-shaped ?)",
        "Dens invaginatus",
        "Dens evaginatus",
      ],
      yes: outcome("cbct", "Une particularité anatomique est présente."),
      no: linkTo("resorption"),
    }),
    resorption: question({
      label: "Existe-t-il des signes de résorption radiculaire externe ou interne ?",
      yes: outcome("cbct", "Des signes de résorption radiculaire sont présents."),
      no: linkTo("j_shaped"),
    }),
    j_shaped: question({
      label: "Observe-t-on une lésion en J et/ou un sondage parodontal isolé marqué ?",
      yes: outcome("cbct", "Des signes compatibles avec une lésion complexe sont présents."),
      no: linkTo("young_patient"),
    }),
    young_patient: question({
      label: "Le patient est-il jeune et/ou les canaux sont-ils larges et clairement visibles ?",
      details: [
        "Le PDF source ajoute une note interne sur l’âge du patient et le stade de Nolla.",
      ],
      yes: outcome("no_cbct", "Le contexte reste suffisamment lisible sans CBCT."),
      no: outcome("cbct", "La lecture 2D ne semble pas suffisante."),
    }),
  },
});

const createLowerMolarInitialTree = () => ({
  first: "anatomy",
  nodes: {
    anatomy: question({
      label: "La dent présente-t-elle une particularité anatomique ?",
      details: [
        "Racines confluentes ou fusionnées (C-shaped ?)",
        "Dens invaginatus",
        "Dens evaginatus",
        "Ento/paramolaris",
      ],
      yes: outcome("cbct", "Une particularité anatomique est présente."),
      no: linkTo("resorption"),
    }),
    resorption: question({
      label: "Existe-t-il des signes de résorption radiculaire externe ou interne ?",
      yes: outcome("cbct", "Des signes de résorption radiculaire sont présents."),
      no: linkTo("j_shaped"),
    }),
    j_shaped: question({
      label: "Observe-t-on une lésion en J et/ou un sondage parodontal isolé marqué ?",
      yes: outcome("cbct", "Des signes compatibles avec une lésion complexe sont présents."),
      no: outcome("no_cbct", "Aucun critère du parcours n’indique un CBCT."),
    }),
  },
});

const createLowerMolarRetreatmentTree = () => ({
  first: "ems_considered",
  nodes: {
    ems_considered: question({
      label: "L’EMS (chirurgie endodontique) est-elle envisagée ?",
      details: [
        "Tenon coronaire adapté",
        "Risque majeur à la dépose",
        "Pronostic défavorable pour un traitement orthograde",
      ],
      yes: outcome("cbct", "Une EMS est envisagée."),
      no: linkTo("prior_ems"),
    }),
    prior_ems: question({
      label: "Existe-t-il des signes radiographiques d’une EMS antérieure ?",
      yes: outcome("cbct", "Une EMS antérieure est suspectée."),
      no: linkTo("ledge"),
    }),
    ledge: question({
      label: "Existe-t-il des signes radiographiques de marche, perforation ou stripping, y compris un tenon mal aligné ?",
      yes: outcome("cbct", "Une complication iatrogène est visible sur la radiographie."),
      no: linkTo("separated_instrument"),
    }),
    separated_instrument: question({
      label: "Existe-t-il des signes radiographiques d’un instrument fracturé ?",
      yes: outcome("cbct", "Un instrument fracturé est visible."),
      no: linkTo("resorption"),
    }),
    resorption: question({
      label: "Existe-t-il des signes de résorption radiculaire externe ou interne ?",
      yes: outcome("cbct", "Des signes de résorption radiculaire sont présents."),
      no: linkTo("j_shaped"),
    }),
    j_shaped: question({
      label: "Observe-t-on une lésion en J et/ou un sondage parodontal isolé marqué ?",
      yes: outcome("cbct", "Des signes compatibles avec une lésion complexe sont présents."),
      no: linkTo("all_canals_treated"),
    }),
    all_canals_treated: question({
      label: "Tous les canaux ont-ils été traités jusqu’à la longueur de travail radiographique ?",
      yes: linkTo("periapical"),
      no: outcome("cbct", "Tous les canaux n’atteignent pas la longueur de travail radiographique."),
    }),
    periapical: question({
      label: "La lésion péri-apicale mesure-t-elle plus de 5 mm de diamètre ?",
      yes: outcome("cbct", "La lésion péri-apicale dépasse 5 mm."),
      no: outcome("no_cbct", "Aucun critère du parcours n’indique un CBCT."),
    }),
  },
});

const DECISION_TREES = {
  toothTypes: [
    {
      id: "incisor_canine",
      label: "Incisive / canine",
      description: "Antérieures et canines",
    },
    {
      id: "premolar",
      label: "Prémolaire",
      description: "Supérieure ou inférieure",
    },
    {
      id: "molar",
      label: "Molaire",
      description: "Avec distinction arcade haute / basse",
    },
  ],
  arches: [
    {
      id: "upper",
      label: "Molaire maxillaire",
      description: "Arcade haute",
    },
    {
      id: "lower",
      label: "Molaire mandibulaire",
      description: "Arcade basse",
    },
  ],
  treatmentTypes: [
    {
      id: "initial",
      label: "Traitement initial",
      description: "Première prise en charge",
    },
    {
      id: "retreatment",
      label: "Retraitement",
      description: "Dent déjà traitée",
    },
  ],
  journeys: {
    incisor_canine__initial: {
      key: "incisor_canine__initial",
      label: "Incisive / canine · Traitement initial",
      ...createAnteriorInitialTree([
        "Plus d’un canal",
        "Dens invaginatus",
        "Dens evaginatus",
      ]),
    },
    incisor_canine__retreatment: {
      key: "incisor_canine__retreatment",
      label: "Incisive / canine · Retraitement",
      ...createAnteriorRetreatmentTree(),
    },
    premolar__initial: {
      key: "premolar__initial",
      label: "Prémolaire · Traitement initial",
      ...createAnteriorInitialTree([
        "Plus de deux canaux",
        "Bifurcation canalaire à partir du tiers moyen ou apical",
        "Dens invaginatus",
        "Dens evaginatus",
      ]),
    },
    premolar__retreatment: {
      key: "premolar__retreatment",
      label: "Prémolaire · Retraitement",
      ...createAnteriorRetreatmentTree(),
    },
    molar_upper__initial: {
      key: "molar_upper__initial",
      label: "Molaire maxillaire · Traitement initial",
      ...createUpperMolarInitialTree(),
    },
    molar_upper__retreatment: {
      key: "molar_upper__retreatment",
      label: "Molaire maxillaire · Retraitement",
      first: "direct_cbct",
      nodes: {
        direct_cbct: outcome("cbct", "Le PDF oriente directement vers un CBCT pour le retraitement d’une molaire maxillaire."),
      },
    },
    molar_lower__initial: {
      key: "molar_lower__initial",
      label: "Molaire mandibulaire · Traitement initial",
      ...createLowerMolarInitialTree(),
    },
    molar_lower__retreatment: {
      key: "molar_lower__retreatment",
      label: "Molaire mandibulaire · Retraitement",
      ...createLowerMolarRetreatmentTree(),
    },
  },
};

window.DECISION_TREES = DECISION_TREES;
