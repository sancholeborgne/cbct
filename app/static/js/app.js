const state = {
  patient: {
    firstName: "",
    lastName: "",
    birthDate: "",
  },
  lockedPatient: false,
  selection: {
    toothType: null,
    arch: null,
    treatmentType: null,
  },
  journeyKey: null,
  currentNodeId: null,
  history: [],
  result: null,
  referral: {
    toothNumber: "",
    doctorName: "",
    isOpen: false,
  },
  uiLocked: false,
};

const refs = {};
const TRANSITION_OUT_MS = 180;
const TRANSITION_IN_MS = 260;

document.addEventListener("DOMContentLoaded", () => {
  bindRefs();
  setBirthDateBounds();
  loadStoredSettings();
  applyTheme(localStorage.getItem("cbct-theme") || "light");
  bindEvents();
  render();
});

function bindRefs() {
  refs.appShell = document.querySelector(".app-shell");
  refs.html = document.documentElement;
  refs.liveRegion = document.getElementById("live-region");
  refs.appFooter = document.querySelector(".app-footer");
  refs.themeToggle = document.getElementById("theme-toggle");
  refs.themeToggleLabel = document.getElementById("theme-toggle-label");
  refs.patientForm = document.getElementById("patient-form");
  refs.firstName = document.getElementById("first-name");
  refs.lastName = document.getElementById("last-name");
  refs.birthDate = document.getElementById("birth-date");
  refs.patientError = document.getElementById("patient-error");
  refs.patientSummary = document.getElementById("patient-summary");
  refs.journeySummary = document.getElementById("journey-summary");
  refs.selectionStepLabel = document.getElementById("selection-step-label");
  refs.selectionTitle = document.getElementById("selection-title");
  refs.selectionBody = document.getElementById("selection-body");
  refs.selectionStage = document.getElementById("selection-stage");
  refs.questionStepLabel = document.getElementById("question-step-label");
  refs.questionIndex = document.getElementById("question-index");
  refs.questionJourney = document.getElementById("question-journey");
  refs.questionTitle = document.getElementById("question-title");
  refs.questionDetails = document.getElementById("question-details");
  refs.questionActions = document.getElementById("question-actions");
  refs.resultBadge = document.getElementById("result-badge");
  refs.resultTitle = document.getElementById("result-title");
  refs.resultBody = document.getElementById("result-body");
  refs.reportPatient = document.getElementById("report-patient");
  refs.reportBirthDate = document.getElementById("report-birth-date");
  refs.reportJourney = document.getElementById("report-journey");
  refs.reportAnswerCount = document.getElementById("report-answer-count");
  refs.answerPillGrid = document.getElementById("answer-pill-grid");
  refs.copyReport = document.getElementById("copy-report");
  refs.downloadReport = document.getElementById("download-report");
  refs.emailReport = document.getElementById("email-report");
  refs.openReferral = document.getElementById("open-referral");
  refs.printReport = document.getElementById("print-report");
  refs.backButton = document.getElementById("back-button");
  refs.restartButton = document.getElementById("restart-button");
  refs.referralBackdrop = document.getElementById("referral-sheet-backdrop");
  refs.referralSheet = document.getElementById("referral-sheet");
  refs.referralTitle = document.getElementById("referral-sheet-title");
  refs.referralToothNumber = document.getElementById("referral-tooth-number");
  refs.referralDoctorName = document.getElementById("referral-doctor-name");
  refs.referralSummary = document.getElementById("referral-summary");
  refs.referralError = document.getElementById("referral-error");
  refs.copyReferral = document.getElementById("copy-referral");
  refs.downloadReferral = document.getElementById("download-referral");
  refs.emailReferral = document.getElementById("email-referral");
  refs.closeReferral = document.getElementById("close-referral");
  refs.screens = {
    identity: document.getElementById("screen-identity"),
    selection: document.getElementById("screen-selection"),
    question: document.getElementById("screen-question"),
    result: document.getElementById("screen-result"),
  };
  refs.stepPills = Array.from(document.querySelectorAll("[data-step]"));
}

function bindEvents() {
  refs.themeToggle.addEventListener("click", toggleTheme);
  refs.patientForm.addEventListener("submit", onPatientSubmit);
  refs.birthDate.addEventListener("input", validateBirthDateField);
  refs.birthDate.addEventListener("change", validateBirthDateField);
  refs.selectionStage.addEventListener("click", onSelectionClick);
  refs.questionActions.addEventListener("click", onQuestionActionClick);
  refs.copyReport.addEventListener("click", copyReportToClipboard);
  refs.downloadReport.addEventListener("click", downloadReport);
  refs.emailReport.addEventListener("click", prepareEmail);
  refs.openReferral.addEventListener("click", toggleReferralSheet);
  refs.printReport.addEventListener("click", () => window.print());
  refs.backButton.addEventListener("click", handleBack);
  refs.restartButton.addEventListener("click", restartFlow);
  refs.referralToothNumber.addEventListener("input", onReferralFieldInput);
  refs.referralDoctorName.addEventListener("input", onReferralFieldInput);
  refs.copyReferral.addEventListener("click", copyReferralToClipboard);
  refs.downloadReferral.addEventListener("click", downloadReferral);
  refs.emailReferral.addEventListener("click", prepareReferralEmail);
  refs.closeReferral.addEventListener("click", closeReferralSheet);
  refs.referralBackdrop.addEventListener("click", onReferralBackdropClick);
  document.addEventListener("keydown", onDocumentKeyDown);
}

function loadStoredSettings() {
  state.referral.doctorName = localStorage.getItem("cbct-referral-doctor-name") || "";
}

function toggleTheme() {
  const nextTheme = refs.html.dataset.theme === "light" ? "dark" : "light";
  applyTheme(nextTheme);
  localStorage.setItem("cbct-theme", nextTheme);
}

function applyTheme(theme) {
  refs.html.dataset.theme = theme;
  const nextLabel = theme === "light" ? "Mode sombre" : "Mode clair";
  refs.themeToggleLabel.textContent = nextLabel;
  refs.themeToggle.setAttribute("aria-label", `Activer le ${nextLabel.toLowerCase()}`);
  refs.themeToggle.setAttribute("title", nextLabel);
}

function onPatientSubmit(event) {
  event.preventDefault();

  const firstName = refs.firstName.value.trim();
  const lastName = refs.lastName.value.trim();
  const birthDate = refs.birthDate.value;

  if (!firstName || !lastName || !birthDate) {
    refs.patientError.textContent = "Veuillez renseigner le prénom, le nom et la date de naissance.";
    return;
  }

  const birthDateError = getBirthDateError(birthDate);
  if (birthDateError) {
    refs.patientError.textContent = birthDateError;
    refs.birthDate.focus({ preventScroll: true });
    return;
  }

  refs.patientError.textContent = "";
  performStateTransition(
    () => {
      state.patient = { firstName, lastName, birthDate };
      state.lockedPatient = true;
    },
    "Patient enregistré. Choisissez maintenant le parcours.",
  );
}

function onSelectionClick(event) {
  if (state.uiLocked) {
    return;
  }

  const button = event.target.closest("[data-selection-id]");
  if (!button) {
    return;
  }

  handleSelection(button.dataset.selectionId);
}

function onQuestionActionClick(event) {
  if (state.uiLocked) {
    return;
  }

  const button = event.target.closest("[data-answer]");
  if (!button) {
    return;
  }

  answerQuestion(button.dataset.answer);
}

function copyReportToClipboard() {
  navigator.clipboard
    .writeText(buildReportText())
    .catch(() => window.alert("Impossible de copier automatiquement le compte rendu."));
}

function downloadReport() {
  const blob = new Blob([buildReportText()], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = buildFileName();
  link.click();
  URL.revokeObjectURL(url);
}

function prepareEmail() {
  const subject = encodeURIComponent(`Compte rendu CBCT - ${state.patient.firstName} ${state.patient.lastName}`);
  const body = encodeURIComponent(buildReportText());
  window.location.href = `mailto:?subject=${subject}&body=${body}`;
}

function render() {
  syncIdentityForm();
  renderPatientSummary();
  renderJourneySummary();
  renderStepIndicator();
  renderSelectionScreen();
  renderQuestionScreen();
  renderResultScreen();
  renderFooter();
  renderReferralSheet();
  renderActiveScreen();
}

function syncIdentityForm() {
  refs.firstName.value = state.patient.firstName;
  refs.lastName.value = state.patient.lastName;
  refs.birthDate.value = state.patient.birthDate;
}

function resetFlowState({ clearPatient = false } = {}) {
  if (clearPatient) {
    state.patient = {
      firstName: "",
      lastName: "",
      birthDate: "",
    };
  }

  state.lockedPatient = clearPatient ? false : state.lockedPatient;
  state.selection = {
    toothType: null,
    arch: null,
    treatmentType: null,
  };
  state.journeyKey = null;
  state.currentNodeId = null;
  state.history = [];
  state.result = null;
  state.referral.toothNumber = "";
  state.referral.isOpen = false;
  refs.patientError.textContent = "";
  refs.birthDate.setCustomValidity("");
  refs.referralError.textContent = "";
}

function setBirthDateBounds() {
  refs.birthDate.min = formatInputDate(getDateYearsAgo(150));
  refs.birthDate.max = formatInputDate(getDateYearsAgo(7));
}

function validateBirthDateField() {
  if (!refs.birthDate.value) {
    refs.patientError.textContent = "";
    refs.birthDate.setCustomValidity("");
    return;
  }

  const error = getBirthDateError(refs.birthDate.value);
  refs.birthDate.setCustomValidity(error || "");
  refs.patientError.textContent = error || "";
}

function renderPatientSummary() {
  if (!state.patient.firstName) {
    refs.patientSummary.textContent = "Non renseigné";
    return;
  }

  refs.patientSummary.textContent =
    `${state.patient.firstName} ${state.patient.lastName} · ${formatDate(state.patient.birthDate)}`;
}

function renderJourneySummary() {
  refs.journeySummary.textContent = getJourneyLabel() || "Choix en cours";
}

function renderStepIndicator() {
  if (!refs.stepPills.length) {
    return;
  }

  const currentStep = getCurrentStepNumber();

  refs.stepPills.forEach((pill) => {
    const step = Number(pill.dataset.step);
    pill.classList.toggle("is-current", step === currentStep);
    pill.classList.toggle("is-complete", step < currentStep);
  });
}

function renderSelectionScreen() {
  const prompt = getSelectionPrompt();
  refs.selectionTitle.textContent = prompt.title;
  refs.selectionBody.textContent = prompt.body;
  refs.selectionStepLabel.textContent = `Étape 2 · ${prompt.progress}`;

  refs.selectionStage.className = `option-grid option-grid-${prompt.options.length}`;
  refs.selectionStage.innerHTML = prompt.options
    .map(
      (option) => `
        <button class="option-card" type="button" data-selection-id="${option.id}">
          <span class="option-title">${escapeHtml(option.label)}</span>
          <span class="option-copy">${escapeHtml(option.description)}</span>
        </button>
      `,
    )
    .join("");
}

function renderQuestionScreen() {
  const journey = getActiveJourney();
  const node = journey && state.currentNodeId ? journey.nodes[state.currentNodeId] : null;

  if (!node) {
    refs.questionStepLabel.textContent = "Étape 3";
    refs.questionIndex.textContent = "Question";
    refs.questionJourney.textContent = "Parcours";
    refs.questionTitle.textContent = "Le questionnaire apparaîtra ici.";
    refs.questionDetails.innerHTML = "";
    return;
  }

  refs.questionStepLabel.textContent = `Étape 3 · ${state.history.length + 1}/${getQuestionCount(journey)}`;
  refs.questionIndex.textContent = `Question ${state.history.length + 1}`;
  refs.questionJourney.textContent = journey.label;
  refs.questionTitle.textContent = node.label;
  refs.questionDetails.innerHTML = renderDetailChips(node.details || []);
}

function renderResultScreen() {
  if (!state.result) {
    refs.resultBadge.textContent = "Conclusion";
    refs.resultBadge.classList.remove("is-positive", "is-neutral");
    refs.resultTitle.textContent = "Décision";
    refs.resultBody.textContent = "Le résultat final du parcours s’affiche ici.";
    refs.reportPatient.textContent = "-";
    refs.reportBirthDate.textContent = "-";
    refs.reportJourney.textContent = "-";
    refs.reportAnswerCount.textContent = "0";
    refs.answerPillGrid.innerHTML = "";
    return;
  }

  const isCbct = state.result.decision === "cbct";

  refs.resultBadge.textContent = isCbct ? "CBCT recommandé" : "Pas de CBCT";
  refs.resultBadge.classList.toggle("is-positive", isCbct);
  refs.resultBadge.classList.toggle("is-neutral", !isCbct);
  refs.resultTitle.textContent = isCbct ? "Un CBCT est indiqué" : "Le CBCT n’est pas indiqué";
  refs.resultBody.textContent = state.result.reason;
  refs.reportPatient.textContent = `${state.patient.firstName} ${state.patient.lastName}`;
  refs.reportBirthDate.textContent = formatDate(state.patient.birthDate);
  refs.reportJourney.textContent = getJourneyLabel();
  refs.reportAnswerCount.textContent = String(state.history.length);
  refs.answerPillGrid.innerHTML = state.history.length
    ? state.history
        .map(
          (entry, index) => `
            <div class="answer-pill ${entry.answer === "yes" ? "yes" : "no"}">
              <span>Q${index + 1}</span>
              <strong>${entry.answer === "yes" ? "Oui" : "Non"}</strong>
            </div>
          `,
        )
        .join("")
    : `<div class="answer-pill neutral"><span>Info</span><strong>Décision directe</strong></div>`;
}

function renderReferralSheet() {
  if (getCurrentScreen() !== "result") {
    state.referral.isOpen = false;
  }

  refs.referralToothNumber.value = state.referral.toothNumber;
  refs.referralDoctorName.value = state.referral.doctorName;

  const isOpen = Boolean(state.result && state.referral.isOpen);
  const isReady = isReferralReady();
  const summary = buildReferralSummary();

  refs.referralBackdrop.classList.toggle("hidden", !isOpen);
  refs.referralBackdrop.setAttribute("aria-hidden", String(!isOpen));
  refs.openReferral.textContent = isOpen ? "Masquer le courrier" : "Courrier d’adressage";
  refs.openReferral.setAttribute("aria-expanded", String(isOpen));
  refs.copyReferral.disabled = !isReady;
  refs.downloadReferral.disabled = !isReady;
  refs.emailReferral.disabled = !isReady;
  refs.referralSummary.innerHTML = summary
    ? `<strong>${escapeHtml(summary.title)}</strong><span>${escapeHtml(summary.body)}</span>`
    : "";
}

function renderFooter() {
  const currentScreen = getCurrentScreen();
  const showBack = currentScreen !== "identity";
  const showRestart = state.lockedPatient;

  refs.backButton.classList.toggle("hidden", !showBack);
  refs.restartButton.classList.toggle("hidden", !showRestart);
  refs.restartButton.textContent = currentScreen === "result" ? "Nouveau parcours" : "Recommencer";
  refs.backButton.disabled = state.uiLocked || !showBack;
  refs.restartButton.disabled = state.uiLocked || !showRestart;
  refs.appFooter.classList.toggle("hidden", !showBack && !showRestart);
}

function renderActiveScreen() {
  const currentScreen = getCurrentScreen();
  refs.appShell.dataset.screen = currentScreen;

  Object.entries(refs.screens).forEach(([screenName, screen]) => {
    const card = screen.querySelector(".screen-card");
    if (card) {
      card.classList.remove("is-leaving", "is-entering");
    }

    const isActive = screenName === currentScreen;
    screen.classList.toggle("is-active", isActive);
    screen.setAttribute("aria-hidden", String(!isActive));
  });
}

function handleSelection(selectionId) {
  if (!state.selection.toothType) {
    performStateTransition(
      () => {
        state.selection.toothType = selectionId;
        if (selectionId !== "molar") {
          state.selection.arch = null;
        }
      },
      selectionId === "molar"
        ? "Type de dent sélectionné. Choisissez maintenant l’arcade molaire."
        : "Type de dent sélectionné. Choisissez maintenant le contexte du traitement.",
    );
    return;
  }

  if (requiresArch() && !state.selection.arch) {
    performStateTransition(
      () => {
        state.selection.arch = selectionId;
      },
      "Arcade sélectionnée. Choisissez maintenant le contexte du traitement.",
    );
    return;
  }

  if (!state.selection.treatmentType) {
    performStateTransition(
      () => {
        state.selection.treatmentType = selectionId;
        initializeJourney();
      },
      () => buildJourneyAnnouncement(),
    );
  }
}

function initializeJourney() {
  state.journeyKey = buildJourneyKey();
  state.history = [];
  state.result = null;

  const journey = getActiveJourney();
  if (!journey) {
    return;
  }

  const firstNode = journey.nodes[journey.first];
  if (firstNode.type === "outcome") {
    state.currentNodeId = null;
    state.result = {
      decision: firstNode.decision,
      reason: firstNode.reason,
    };
  } else {
    state.currentNodeId = journey.first;
  }
}

function answerQuestion(answer) {
  if (state.uiLocked) {
    return;
  }

  const journey = getActiveJourney();
  const node = journey.nodes[state.currentNodeId];
  const branch = node[answer];
  const announcement =
    branch.type === "outcome"
      ? branch.decision === "cbct"
        ? "Résultat affiché. Un CBCT est indiqué."
        : "Résultat affiché. Le CBCT n’est pas indiqué."
      : `Question suivante. ${journey.nodes[branch.next].label}`;

  performStateTransition(
    () => {
      state.history.push({
        nodeId: state.currentNodeId,
        label: node.label,
        answer,
        reason: branch.reason || "",
      });

      if (branch.type === "outcome") {
        state.currentNodeId = null;
        state.result = {
          decision: branch.decision,
          reason: branch.reason,
        };
        return;
      }

      state.currentNodeId = branch.next;
    },
    announcement,
  );
}

function handleBack() {
  if (state.uiLocked) {
    return;
  }

  if (state.result) {
    state.result = null;

    if (state.history.length > 0) {
      state.currentNodeId = state.history[state.history.length - 1].nodeId;
    } else {
      state.currentNodeId = null;
      state.journeyKey = null;
      state.selection.treatmentType = null;
    }

    render();
    announce("Retour à l’étape précédente.");
    focusCurrentScreen();
    return;
  }

  if (state.currentNodeId) {
    if (state.history.length > 0) {
      const previous = state.history.pop();
      state.currentNodeId = previous.nodeId;
    } else {
      state.currentNodeId = null;
      state.journeyKey = null;
      state.selection.treatmentType = null;
    }

    render();
    announce("Retour à la question précédente.");
    focusCurrentScreen();
    return;
  }

  if (state.selection.treatmentType) {
    state.selection.treatmentType = null;
    state.journeyKey = null;
    state.currentNodeId = null;
    state.result = null;
    render();
    announce("Retour à l’étape précédente.");
    focusCurrentScreen();
    return;
  }

  if (state.selection.arch) {
    state.selection.arch = null;
    state.journeyKey = null;
    render();
    announce("Retour à l’étape précédente.");
    focusCurrentScreen();
    return;
  }

  if (state.selection.toothType) {
    state.selection.toothType = null;
    state.journeyKey = null;
    render();
    announce("Retour à l’étape précédente.");
    focusCurrentScreen();
    return;
  }

  if (state.lockedPatient) {
    state.lockedPatient = false;
    render();
    announce("Retour à l’étape précédente.");
    focusCurrentScreen();
  }
}

function restartFlow() {
  if (state.uiLocked) {
    return;
  }

  resetFlowState({ clearPatient: true });
  render();
  announce("Le parcours a été réinitialisé. Vous êtes revenu au début.");
  focusCurrentScreen();
}

function getCurrentScreen() {
  if (!state.lockedPatient) {
    return "identity";
  }

  if (state.result) {
    return "result";
  }

  if (state.currentNodeId) {
    return "question";
  }

  return "selection";
}

function getCurrentStepNumber() {
  const currentScreen = getCurrentScreen();

  if (currentScreen === "identity") {
    return 1;
  }

  if (currentScreen === "selection") {
    return 2;
  }

  if (currentScreen === "question") {
    return 3;
  }

  return 4;
}

function getSelectionPrompt() {
  if (!state.selection.toothType) {
    return {
      title: "Quel type de dent est concerné ?",
      body: "Choisissez la branche dentaire pour ouvrir le bon parcours.",
      progress: "1 sur 3",
      options: window.DECISION_TREES.toothTypes,
    };
  }

  if (requiresArch() && !state.selection.arch) {
    return {
      title: "Quelle arcade molaire est concernée ?",
      body: "Le schéma distingue les molaires maxillaires et mandibulaires.",
      progress: "2 sur 3",
      options: window.DECISION_TREES.arches,
    };
  }

  return {
    title: "Quel est le contexte du traitement ?",
    body: "Sélectionnez maintenant le type de prise en charge.",
    progress: requiresArch() ? "3 sur 3" : "2 sur 2",
    options: window.DECISION_TREES.treatmentTypes,
  };
}

function requiresArch() {
  return state.selection.toothType === "molar";
}

function buildJourneyKey() {
  if (state.selection.toothType === "molar") {
    return `molar_${state.selection.arch}__${state.selection.treatmentType}`;
  }

  return `${state.selection.toothType}__${state.selection.treatmentType}`;
}

function getActiveJourney() {
  return state.journeyKey ? window.DECISION_TREES.journeys[state.journeyKey] || null : null;
}

function buildJourneyAnnouncement() {
  const journey = getActiveJourney();
  if (!journey) {
    return "Parcours sélectionné.";
  }

  if (state.result) {
    return state.result.decision === "cbct"
      ? "Décision directe. Un CBCT est indiqué."
      : "Décision directe. Le CBCT n’est pas indiqué.";
  }

  const firstQuestion = journey.nodes[state.currentNodeId];
  return firstQuestion ? `Question 1. ${firstQuestion.label}` : "Le questionnaire commence.";
}

function getJourneyLabel() {
  const journey = getActiveJourney();
  if (journey) {
    return journey.label;
  }

  if (!state.selection.toothType) {
    return "";
  }

  const parts = [];
  const tooth = window.DECISION_TREES.toothTypes.find((item) => item.id === state.selection.toothType);
  if (tooth) {
    parts.push(tooth.label);
  }

  if (state.selection.arch) {
    const arch = window.DECISION_TREES.arches.find((item) => item.id === state.selection.arch);
    if (arch) {
      parts.push(arch.label);
    }
  }

  if (state.selection.treatmentType) {
    const treatment = window.DECISION_TREES.treatmentTypes.find(
      (item) => item.id === state.selection.treatmentType,
    );
    if (treatment) {
      parts.push(treatment.label);
    }
  }

  return parts.join(" · ");
}

function getQuestionCount(journey) {
  if (!journey) {
    return 0;
  }

  return Object.values(journey.nodes).filter((node) => node.type === "question").length;
}

function renderDetailChips(details) {
  if (!details || !details.length) {
    return "";
  }

  return details.map((detail) => `<div class="detail-chip">${escapeHtml(detail)}</div>`).join("");
}

function buildReportText() {
  const lines = [
    "Compte rendu d’orientation CBCT",
    "",
    `Date : ${new Date().toLocaleString("fr-FR")}`,
    `Patient : ${state.patient.firstName} ${state.patient.lastName}`,
    `Date de naissance : ${formatDate(state.patient.birthDate)}`,
    `Parcours : ${getJourneyLabel()}`,
    `Décision : ${state.result && state.result.decision === "cbct" ? "CBCT recommandé" : "Pas de CBCT selon l’arbre"}`,
    `Motif final : ${state.result ? state.result.reason : ""}`,
    "",
    "Historique des réponses :",
    ...(state.history.length
      ? state.history.map(
          (entry, index) => `${index + 1}. ${entry.label} -> ${entry.answer === "yes" ? "Oui" : "Non"}`,
        )
      : ["Décision directe sans question intermédiaire supplémentaire."]),
    "",
    "Note : résultat issu de l’arbre de décision fourni, à valider par le praticien.",
  ];

  return lines.join("\n");
}

function toggleReferralSheet() {
  if (!state.result || state.uiLocked) {
    return;
  }

  state.referral.isOpen = !state.referral.isOpen;
  refs.referralError.textContent = "";
  renderReferralSheet();

  if (state.referral.isOpen) {
    focusReferralSheet();
    announce("Le formulaire de courrier d’adressage est ouvert.");
    return;
  }

  refs.openReferral.focus({ preventScroll: true });
  announce("Le formulaire de courrier d’adressage est fermé.");
}

function closeReferralSheet() {
  if (!state.referral.isOpen) {
    return;
  }

  state.referral.isOpen = false;
  refs.referralError.textContent = "";
  renderReferralSheet();
  refs.openReferral.focus({ preventScroll: true });
}

function onReferralBackdropClick(event) {
  if (event.target === refs.referralBackdrop) {
    closeReferralSheet();
  }
}

function onDocumentKeyDown(event) {
  if (event.key === "Escape" && state.referral.isOpen) {
    closeReferralSheet();
  }
}

function onReferralFieldInput(event) {
  if (event.target === refs.referralToothNumber) {
    state.referral.toothNumber = event.target.value.trim();
  }

  if (event.target === refs.referralDoctorName) {
    state.referral.doctorName = event.target.value.trim();
    localStorage.setItem("cbct-referral-doctor-name", state.referral.doctorName);
  }

  refs.referralError.textContent = "";
  renderReferralSheet();
}

function focusReferralSheet() {
  window.requestAnimationFrame(() => {
    const target = state.referral.toothNumber ? refs.referralDoctorName : refs.referralToothNumber;
    target.focus({ preventScroll: true });
  });
}

function isReferralReady() {
  return Boolean(state.referral.toothNumber.trim() && state.referral.doctorName.trim());
}

function ensureReferralReady() {
  if (isReferralReady()) {
    refs.referralError.textContent = "";
    return true;
  }

  refs.referralError.textContent =
    "Renseignez le numéro de dent et le nom du praticien pour générer le courrier.";

  if (!state.referral.toothNumber.trim()) {
    refs.referralToothNumber.focus({ preventScroll: true });
  } else {
    refs.referralDoctorName.focus({ preventScroll: true });
  }

  return false;
}

function copyReferralToClipboard() {
  if (!ensureReferralReady()) {
    return;
  }

  navigator.clipboard.writeText(buildReferralText()).then(
    () => announce("Le courrier d’adressage a été copié."),
    () => window.alert("Impossible de copier automatiquement le courrier."),
  );
}

function downloadReferral() {
  if (!ensureReferralReady()) {
    return;
  }

  const blob = new Blob([buildReferralText()], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = buildReferralFileName();
  link.click();
  URL.revokeObjectURL(url);
  announce("Le courrier d’adressage a été téléchargé.");
}

function prepareReferralEmail() {
  if (!ensureReferralReady()) {
    return;
  }

  const subject = encodeURIComponent(`Courrier d’adressage - ${state.patient.firstName} ${state.patient.lastName}`);
  const body = encodeURIComponent(buildReferralText());
  window.location.href = `mailto:?subject=${subject}&body=${body}`;
}

function buildReferralSummary() {
  if (!state.result) {
    return null;
  }

  const tooth = state.referral.toothNumber.trim() || "à préciser";
  const title = `${getTreatmentLabel()} · dent n°${tooth}`;
  const body = state.result.reason;
  return { title, body };
}

function buildReferralText() {
  const patientName = `${state.patient.firstName} ${state.patient.lastName}`.trim();
  const treatmentLabel = getTreatmentLabel();
  const findings = getReferralFindings();
  const decisionLine =
    state.result && state.result.decision === "cbct"
      ? "Dans ce contexte, un CBCT paraît indiqué selon l’arbre décisionnel utilisé."
      : "Dans ce contexte, le parcours ne retient pas d’indication forte de CBCT selon l’arbre décisionnel utilisé.";

  const lines = [
    "Courrier d’adressage",
    "",
    "Cher confrère, chère consœur,",
    "",
    `Je vous adresse Madame / Monsieur ${patientName}, né(e) le ${formatDate(state.patient.birthDate)}, pour ${treatmentLabel} de la dent n°${state.referral.toothNumber.trim()}.`,
    `Le parcours suivi concerne ${getJourneyLabel().toLowerCase()}.`,
    findings,
    decisionLine,
    "",
    "Je vous remercie par avance de ce que vous pourrez faire pour ce patient.",
    "",
    "Confraternellement,",
    formatDoctorSignature(state.referral.doctorName),
  ];

  return lines.join("\n");
}

function getTreatmentLabel() {
  return state.selection.treatmentType === "retreatment"
    ? "un retraitement endodontique"
    : "un traitement endodontique";
}

function getReferralFindings() {
  const positiveFindings = state.history
    .filter((entry) => entry.answer === "yes")
    .map((entry) => cleanSentence(entry.reason || entry.label));

  if (positiveFindings.length) {
    return `Les éléments relevés au cours du parcours sont les suivants : ${positiveFindings.join(" ; ")}.`;
  }

  return `Le principal élément retenu par le parcours est le suivant : ${cleanSentence(state.result ? state.result.reason : "")}.`;
}

function formatDoctorSignature(value) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "Dr XXXXX";
  }

  return /^dr\b/i.test(trimmed) ? trimmed : `Dr ${trimmed}`;
}

function cleanSentence(value) {
  return String(value || "").trim().replace(/\s+/g, " ").replace(/[.;:,!?]+$/g, "");
}

function buildReferralFileName() {
  const safeName = `${state.patient.firstName}-${state.patient.lastName}`
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-");
  const safeTooth = state.referral.toothNumber.toLowerCase().replace(/[^a-z0-9-]+/g, "-");
  return `courrier-adressage-${safeName || "patient"}-${safeTooth || "dent"}.txt`;
}

function buildFileName() {
  const safeName = `${state.patient.firstName}-${state.patient.lastName}`
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-");
  return `compte-rendu-cbct-${safeName || "patient"}.txt`;
}

function formatDate(value) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function getBirthDateError(value) {
  if (!value) {
    return "";
  }

  const selectedDate = new Date(`${value}T00:00:00`);
  const youngestAllowed = getDateYearsAgo(7);
  const oldestAllowed = getDateYearsAgo(150);

  if (selectedDate > youngestAllowed) {
    return "La date de naissance doit correspondre à un âge d’au moins 7 ans.";
  }

  if (selectedDate < oldestAllowed) {
    return "La date de naissance doit correspondre à un âge inférieur ou égal à 150 ans.";
  }

  return "";
}

function getDateYearsAgo(years) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setFullYear(date.getFullYear() - years);
  return date;
}

function formatInputDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function performStateTransition(updateState, announcement = "") {
  if (state.uiLocked) {
    return;
  }

  const activeCard = getActiveCardElement();
  state.uiLocked = true;
  refs.appShell.classList.add("is-locked");

  if (activeCard) {
    activeCard.classList.remove("is-entering");
    activeCard.classList.add("is-leaving");
  }

  window.setTimeout(() => {
    updateState();
    render();
    announce(typeof announcement === "function" ? announcement() : announcement);
    focusCurrentScreen();

    const nextCard = getActiveCardElement();
    if (nextCard) {
      nextCard.classList.remove("is-leaving");
      nextCard.classList.add("is-entering");
    }

    window.setTimeout(() => {
      if (nextCard) {
        nextCard.classList.remove("is-entering");
      }
      state.uiLocked = false;
      refs.appShell.classList.remove("is-locked");
      renderFooter();
    }, TRANSITION_IN_MS);
  }, TRANSITION_OUT_MS);
}

function getActiveCardElement() {
  return document.querySelector(".screen.is-active .screen-card");
}

function focusCurrentScreen() {
  window.requestAnimationFrame(() => {
    const currentScreen = getCurrentScreen();
    let target = null;

    if (currentScreen === "identity") {
      target = refs.firstName;
    } else if (currentScreen === "selection") {
      target = refs.selectionTitle;
    } else if (currentScreen === "question") {
      target = refs.questionTitle;
    } else if (currentScreen === "result") {
      target = refs.resultTitle;
    }

    if (target) {
      target.focus({ preventScroll: true });
    }
  });
}

function announce(message) {
  if (!message || !refs.liveRegion) {
    return;
  }

  refs.liveRegion.textContent = "";
  window.setTimeout(() => {
    refs.liveRegion.textContent = message;
  }, 20);
}
