const SUPABASE_URL = "https://ypkezqkloqdsdcfczjdc.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlwa2V6cWtsb3Fkc2RjZmN6amRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxMzMzMDEsImV4cCI6MjA5MDcwOTMwMX0.sxbkuowHP_0csh-26ioLQqUf284yqc3g6FKMLgOD1G0";

const ROLES = {
  admin: "admin",
  collaborator: "colaborador"
};

const STATUS = {
  pending: "pendente",
  approved: "aprovado",
  rejected: "recusado",
  suspended: "suspenso"
};

function showMessage(element, text, type = "") {
  if (!element) return;
  element.textContent = text;
  element.className = "message";
  if (type) element.classList.add(type);
}

function clearMessage(element) {
  showMessage(element, "");
}

function parsePositiveNumber(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

function isSupabaseConfigured() {
  return !SUPABASE_URL.includes("COLE_AQUI") && !SUPABASE_ANON_KEY.includes("COLE_AQUI");
}

function initApp() {
  const authSection = document.getElementById("authSection");
  const appSection = document.getElementById("appSection");

  const loginForm = document.getElementById("loginForm");
  const loginEmail = document.getElementById("loginEmail");
  const loginPassword = document.getElementById("loginPassword");
  const loginMessage = document.getElementById("loginMessage");
  const goToRegisterBtn = document.getElementById("goToRegisterBtn");
  const loginPanel = document.getElementById("loginPanel");
  const requestPanel = document.getElementById("requestPanel");

  const requestForm = document.getElementById("requestForm");
  const requestEmail = document.getElementById("requestEmail");
  const requestUsername = document.getElementById("requestUsername");
  const requestPassword = document.getElementById("requestPassword");
  const requestMessage = document.getElementById("requestMessage");
  const backToLoginBtn = document.getElementById("backToLoginBtn");

  const tabDashboard = document.getElementById("tabDashboard");
  const tabBebidas = document.getElementById("tabBebidas");
  const tabUsuarios = document.getElementById("tabUsuarios");

  const dashboardSection = document.getElementById("dashboardSection");
  const bebidasSection = document.getElementById("bebidasSection");
  const usuariosSection = document.getElementById("usuariosSection");

  const sessionLabel = document.getElementById("sessionLabel");
  const logoutBtn = document.getElementById("logoutBtn");

  const drinkSelect = document.getElementById("drinkSelect");
  const currentWeight = document.getElementById("currentWeight");
  const remainingMl = document.getElementById("remainingMl");
  const doseCount = document.getElementById("doseCount");
  const dashboardMessage = document.getElementById("dashboardMessage");

  const drinkForm = document.getElementById("drinkForm");
  const drinkName = document.getElementById("drinkName");
  const totalVolume = document.getElementById("totalVolume");
  const fullWeight = document.getElementById("fullWeight");
  const drinkMessage = document.getElementById("drinkMessage");
  const drinkList = document.getElementById("drinkList");
  const emptyDrinkMessage = document.getElementById("emptyDrinkMessage");

  const pendingList = document.getElementById("pendingList");
  const emptyPendingMessage = document.getElementById("emptyPendingMessage");
  const usersList = document.getElementById("usersList");
  const usersMessage = document.getElementById("usersMessage");

  if (
    !authSection || !appSection || !loginForm || !requestForm || !tabDashboard ||
    !tabBebidas || !tabUsuarios || !dashboardSection || !bebidasSection || !usuariosSection ||
    !loginPanel || !requestPanel || !goToRegisterBtn || !backToLoginBtn
  ) {
    return;
  }

  if (!window.supabase || !window.supabase.createClient) {
    showMessage(loginMessage, "SDK do Supabase nao carregou.", "error");
    return;
  }

  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  let currentProfile = null;
  let drinksCache = [];
  let usersCache = [];

  function setAuthTab(tabId) {
    const showLogin = tabId === "login";
    loginPanel.classList.toggle("active", showLogin);
    requestPanel.classList.toggle("active", !showLogin);
  }

  function setActiveTab(tabId) {
    const tabs = [
      { button: tabDashboard, section: dashboardSection, id: "dashboard" },
      { button: tabBebidas, section: bebidasSection, id: "bebidas" },
      { button: tabUsuarios, section: usuariosSection, id: "usuarios" }
    ];

    tabs.forEach((tab) => {
      const isActive = tab.id === tabId;
      tab.button.classList.toggle("active", isActive);
      tab.section.classList.toggle("active", isActive);
    });
  }

  function calculateDashboard() {
    clearMessage(dashboardMessage);
    if (!drinkSelect.value || !currentWeight.value) {
      remainingMl.textContent = "0 mL";
      doseCount.textContent = "0";
      return;
    }

    const currentWeightNumber = parsePositiveNumber(currentWeight.value);
    if (!currentWeightNumber) {
      remainingMl.textContent = "0 mL";
      doseCount.textContent = "0";
      showMessage(dashboardMessage, "Digite um peso atual valido maior que zero.", "error");
      return;
    }

    const drink = drinksCache.find((item) => item.id === drinkSelect.value);
    if (!drink) {
      remainingMl.textContent = "0 mL";
      doseCount.textContent = "0";
      showMessage(dashboardMessage, "Bebida selecionada nao encontrada.", "error");
      return;
    }

    const remaining = (currentWeightNumber / drink.full_weight) * drink.total_volume;
    const doses = Math.floor((currentWeightNumber / drink.full_weight) * drink.total_volume / 60);

    remainingMl.textContent = `${Math.max(0, remaining).toFixed(0)} mL`;
    doseCount.textContent = String(Math.max(0, doses));
  }

  function renderDrinkOptions() {
    const selectedValue = drinkSelect.value;
    drinkSelect.innerHTML = '<option value="">Selecione...</option>';
    drinksCache.forEach((drink) => {
      const option = document.createElement("option");
      option.value = drink.id;
      option.textContent = drink.name;
      drinkSelect.appendChild(option);
    });

    if (drinksCache.some((item) => item.id === selectedValue)) {
      drinkSelect.value = selectedValue;
    }
  }

  function renderDrinksList() {
    drinkList.innerHTML = "";
    emptyDrinkMessage.style.display = drinksCache.length === 0 ? "block" : "none";

    drinksCache.forEach((drink) => {
      const li = document.createElement("li");
      li.className = "drink-item";

      const info = document.createElement("div");
      info.className = "drink-info";
      const nameEl = document.createElement("strong");
      nameEl.textContent = drink.name;
      const metaEl = document.createElement("span");
      metaEl.textContent = `Volume: ${drink.total_volume} mL | Peso cheia: ${drink.full_weight} g`;
      info.appendChild(nameEl);
      info.appendChild(metaEl);
      li.appendChild(info);

      if (currentProfile && currentProfile.role === ROLES.admin) {
        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.className = "btn danger";
        deleteBtn.textContent = "Excluir";
        deleteBtn.addEventListener("click", async () => {
          const confirmed = window.confirm(`Deseja excluir "${drink.name}"?`);
          if (!confirmed) return;
          const { error } = await supabase.from("drinks").delete().eq("id", drink.id);
          if (error) {
            showMessage(drinkMessage, "Erro ao excluir bebida.", "error");
            return;
          }
          await loadDrinks();
          calculateDashboard();
        });
        li.appendChild(deleteBtn);
      }

      drinkList.appendChild(li);
    });
  }

  function canEditUser(targetUser) {
    if (!currentProfile || currentProfile.role !== ROLES.admin) return false;
    if (!targetUser) return false;
    return targetUser.id !== currentProfile.id;
  }

  function renderPendingRequests() {
    const pendingUsers = usersCache.filter((user) => user.status === STATUS.pending);
    pendingList.innerHTML = "";
    emptyPendingMessage.style.display = pendingUsers.length === 0 ? "block" : "none";

    pendingUsers.forEach((user) => {
      const li = document.createElement("li");
      li.className = "drink-item";

      const info = document.createElement("div");
      info.className = "drink-info";
      const name = document.createElement("strong");
      name.textContent = user.username;
      const meta = document.createElement("span");
      meta.textContent = "Solicitacao pendente de aprovacao";
      info.appendChild(name);
      info.appendChild(meta);

      const actions = document.createElement("div");
      actions.className = "row-actions";

      const approveBtn = document.createElement("button");
      approveBtn.type = "button";
      approveBtn.className = "btn primary";
      approveBtn.textContent = "Aprovar";
      approveBtn.addEventListener("click", async () => {
        await updateUserProfile(user.id, { status: STATUS.approved });
      });

      const rejectBtn = document.createElement("button");
      rejectBtn.type = "button";
      rejectBtn.className = "btn danger";
      rejectBtn.textContent = "Recusar";
      rejectBtn.addEventListener("click", async () => {
        await updateUserProfile(user.id, { status: STATUS.rejected });
      });

      actions.appendChild(approveBtn);
      actions.appendChild(rejectBtn);
      li.appendChild(info);
      li.appendChild(actions);
      pendingList.appendChild(li);
    });
  }

  function renderUsersManagement() {
    usersList.innerHTML = "";
    clearMessage(usersMessage);

    usersCache.forEach((user) => {
      const li = document.createElement("li");
      li.className = "drink-item";

      const info = document.createElement("div");
      info.className = "drink-info";

      const name = document.createElement("strong");
      name.textContent = user.username;
      const meta = document.createElement("span");
      meta.textContent = `Perfil: ${user.role} | Status: ${user.status}`;

      info.appendChild(name);
      info.appendChild(meta);
      li.appendChild(info);

      const actions = document.createElement("div");
      actions.className = "row-actions";

      const roleSelect = document.createElement("select");
      roleSelect.className = "inline-select";
      roleSelect.innerHTML = `
        <option value="${ROLES.admin}">admin</option>
        <option value="${ROLES.collaborator}">colaborador</option>
      `;
      roleSelect.value = user.role;
      roleSelect.disabled = !canEditUser(user);
      roleSelect.addEventListener("change", async () => {
        await updateUserProfile(user.id, { role: roleSelect.value });
      });
      actions.appendChild(roleSelect);

      if (canEditUser(user) && user.status !== STATUS.approved) {
        const approveBtn = document.createElement("button");
        approveBtn.type = "button";
        approveBtn.className = "btn primary";
        approveBtn.textContent = "Aprovar cadastro";
        approveBtn.addEventListener("click", async () => {
          await updateUserProfile(user.id, { status: STATUS.approved });
        });
        actions.appendChild(approveBtn);
      }

      if (canEditUser(user) && user.status === STATUS.approved) {
        const rejectBtn = document.createElement("button");
        rejectBtn.type = "button";
        rejectBtn.className = "btn danger";
        rejectBtn.textContent = "Recusar cadastro";
        rejectBtn.addEventListener("click", async () => {
          const confirmed = window.confirm(`Deseja recusar o cadastro de "${user.username}"?`);
          if (!confirmed) return;
          await updateUserProfile(user.id, { status: STATUS.rejected });
        });
        actions.appendChild(rejectBtn);
      }

      if (canEditUser(user) && (user.status === STATUS.approved || user.status === STATUS.suspended)) {
        const suspendBtn = document.createElement("button");
        suspendBtn.type = "button";
        suspendBtn.className = "btn danger";
        suspendBtn.textContent = user.status === STATUS.suspended ? "Reativar" : "Suspender";
        suspendBtn.addEventListener("click", async () => {
          const nextStatus = user.status === STATUS.suspended ? STATUS.approved : STATUS.suspended;
          await updateUserProfile(user.id, { status: nextStatus });
        });
        actions.appendChild(suspendBtn);
      }

      li.appendChild(actions);
      usersList.appendChild(li);
    });
  }

  async function loadDrinks() {
    const { data, error } = await supabase
      .from("drinks")
      .select("id,name,total_volume,full_weight,created_by,created_at")
      .order("created_at", { ascending: false });

    if (error) {
      drinksCache = [];
      showMessage(dashboardMessage, "Erro ao carregar bebidas.", "error");
      renderDrinkOptions();
      renderDrinksList();
      return;
    }

    drinksCache = data || [];
    renderDrinkOptions();
    renderDrinksList();
  }

  async function loadUsers() {
    const { data, error } = await supabase
      .from("profiles")
      .select("id,username,role,status,created_at")
      .order("created_at", { ascending: false });

    if (error) {
      usersCache = [];
      showMessage(usersMessage, "Erro ao carregar usuarios.", "error");
      renderPendingRequests();
      renderUsersManagement();
      return;
    }

    usersCache = data || [];
    renderPendingRequests();
    renderUsersManagement();
  }

  async function updateUserProfile(userId, payload) {
    const { error } = await supabase.from("profiles").update(payload).eq("id", userId);
    if (error) {
      showMessage(usersMessage, "Erro ao atualizar usuario.", "error");
      return;
    }
    await loadUsers();
  }

  async function getCurrentProfile() {
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;
    if (!user) return null;

    const { data, error } = await supabase
      .from("profiles")
      .select("id,username,role,status")
      .eq("id", user.id)
      .single();

    if (error) return null;
    return data;
  }

  async function refreshAfterLogin() {
    sessionLabel.textContent = `Usuario: ${currentProfile.username} (${currentProfile.role})`;

    const isAdmin = currentProfile.role === ROLES.admin;
    tabBebidas.classList.toggle("hidden", !isAdmin);
    tabUsuarios.classList.toggle("hidden", !isAdmin);

    authSection.classList.remove("active");
    authSection.classList.add("hidden");
    appSection.classList.remove("hidden");

    setActiveTab("dashboard");
    await loadDrinks();
    calculateDashboard();

    if (isAdmin) {
      await loadUsers();
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    currentProfile = null;
    appSection.classList.add("hidden");
    authSection.classList.remove("hidden");
    authSection.classList.add("active");
    loginForm.reset();
    requestForm.reset();
    clearMessage(loginMessage);
    clearMessage(requestMessage);
    setAuthTab("login");
  }

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearMessage(loginMessage);

    if (!isSupabaseConfigured()) {
      showMessage(loginMessage, "Configure SUPABASE_URL e SUPABASE_ANON_KEY no script.js.", "error");
      return;
    }

    const email = loginEmail.value.trim();
    const password = loginPassword.value.trim();

    if (!email || !password) {
      showMessage(loginMessage, "Informe e-mail e senha.", "error");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      showMessage(loginMessage, "E-mail ou senha invalidos.", "error");
      return;
    }

    currentProfile = await getCurrentProfile();
    if (!currentProfile) {
      await supabase.auth.signOut();
      showMessage(loginMessage, "Perfil nao encontrado para este usuario.", "error");
      return;
    }

    if (currentProfile.status === STATUS.pending) {
      await supabase.auth.signOut();
      showMessage(loginMessage, "Seu cadastro ainda esta pendente de aprovacao.", "error");
      return;
    }

    if (currentProfile.status === STATUS.rejected) {
      await supabase.auth.signOut();
      showMessage(loginMessage, "Seu cadastro foi recusado pelo administrador.", "error");
      return;
    }

    if (currentProfile.status === STATUS.suspended) {
      await supabase.auth.signOut();
      showMessage(loginMessage, "Seu usuario esta suspenso.", "error");
      return;
    }

    await refreshAfterLogin();
  });

  requestForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearMessage(requestMessage);

    if (!isSupabaseConfigured()) {
      showMessage(requestMessage, "Configure SUPABASE_URL e SUPABASE_ANON_KEY no script.js.", "error");
      return;
    }

    const email = requestEmail.value.trim();
    const username = requestUsername.value.trim();
    const password = requestPassword.value.trim();

    if (!email || !username || !password) {
      showMessage(requestMessage, "Preencha e-mail, usuario e senha.", "error");
      return;
    }

    if (username.length < 3 || password.length < 6) {
      showMessage(requestMessage, "Use usuario com 3+ e senha com 6+ caracteres.", "error");
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username }
      }
    });

    if (error) {
      const errorText = String(error.message || "").toLowerCase();
      const duplicateEmail =
        errorText.includes("already") ||
        errorText.includes("registered") ||
        errorText.includes("exists") ||
        errorText.includes("user_already_exists") ||
        errorText.includes("email_exists");

      if (duplicateEmail) {
        showMessage(requestMessage, "Este e-mail ja esta cadastrado.", "error");
      } else {
        showMessage(requestMessage, "Nao foi possivel enviar solicitacao. Verifique os dados.", "error");
      }
      return;
    }

    await supabase.auth.signOut();
    requestForm.reset();
    window.alert("Cadastro concluido com sucesso. Seu acesso esta sujeito a aprovacao do administrador.");
    showMessage(
      requestMessage,
      "Solicitacao enviada. Aguarde aprovacao do administrador (e confirmacao de e-mail, se ativa).",
      "success"
    );
    setAuthTab("login");
  });

  drinkForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearMessage(drinkMessage);

    if (!currentProfile || currentProfile.role !== ROLES.admin) {
      showMessage(drinkMessage, "Apenas administradores podem cadastrar bebidas.", "error");
      return;
    }

    const name = drinkName.value.trim();
    const totalVolumeNumber = parsePositiveNumber(totalVolume.value);
    const fullWeightNumber = parsePositiveNumber(fullWeight.value);

    if (!name || !totalVolumeNumber || !fullWeightNumber) {
      showMessage(drinkMessage, "Preencha todos os campos com valores positivos.", "error");
      return;
    }

    const { data: authData } = await supabase.auth.getUser();
    const createdBy = authData?.user?.id || null;

    const { error } = await supabase.from("drinks").insert({
      name,
      total_volume: totalVolumeNumber,
      full_weight: fullWeightNumber,
      created_by: createdBy
    });

    if (error) {
      showMessage(drinkMessage, "Erro ao salvar bebida.", "error");
      return;
    }

    drinkForm.reset();
    showMessage(drinkMessage, "Bebida cadastrada com sucesso.", "success");
    await loadDrinks();
  });

  tabDashboard.addEventListener("click", () => setActiveTab("dashboard"));

  tabBebidas.addEventListener("click", () => {
    if (!currentProfile || currentProfile.role !== ROLES.admin) return;
    setActiveTab("bebidas");
  });

  tabUsuarios.addEventListener("click", async () => {
    if (!currentProfile || currentProfile.role !== ROLES.admin) return;
    setActiveTab("usuarios");
    await loadUsers();
  });

  drinkSelect.addEventListener("change", calculateDashboard);
  currentWeight.addEventListener("input", calculateDashboard);
  logoutBtn.addEventListener("click", logout);
  goToRegisterBtn.addEventListener("click", () => setAuthTab("request"));
  backToLoginBtn.addEventListener("click", () => setAuthTab("login"));

  (async () => {
    if (!isSupabaseConfigured()) {
      showMessage(loginMessage, "Configure SUPABASE_URL e SUPABASE_ANON_KEY no script.js.", "error");
      return;
    }

    currentProfile = await getCurrentProfile();
    if (!currentProfile) return;

    if (
      currentProfile.status === STATUS.pending ||
      currentProfile.status === STATUS.rejected ||
      currentProfile.status === STATUS.suspended
    ) {
      await supabase.auth.signOut();
      return;
    }

    await refreshAfterLogin();
  })();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}
