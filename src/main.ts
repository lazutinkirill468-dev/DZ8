import "./style.css";

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL ?? "https://inai-col2.fishrungames.com"
).replace(/\/+$/, "");

type Specialization =
  | "vocals"
  | "guitar"
  | "bass"
  | "drums"
  | "keys"
  | "other";

interface Profile {
  first_name: string;
  specialization: Specialization;
  specialization_display: string;
  bio: string;
  fee: string;
}

interface User {
  id: number;
  username: string;
  profile: Profile;
}

interface SpecializationOption {
  value: Specialization;
  label: string;
}

class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const defaultSpecializations: SpecializationOption[] = [
  { value: "vocals", label: "Вокал" },
  { value: "guitar", label: "Гитара" },
  { value: "bass", label: "Бас-гитара" },
  { value: "drums", label: "Ударные" },
  { value: "keys", label: "Клавишные" },
  { value: "other", label: "Другое" },
];

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("Не найден корневой элемент приложения.");
}

let currentUser: User | null = null;
let specializations = defaultSpecializations;
let authMode: "login" | "register" = "login";
let notice = "";
let noticeKind: "error" | "success" | "info" = "info";
let busy = false;

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      credentials: "include",
      headers: {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new ApiError(
      "Не удалось связаться с сервером. Проверьте подключение и настройки API.",
      0,
    );
  }

  const responseText = await response.text();
  let body: unknown;
  if (responseText) {
    try {
      body = JSON.parse(responseText);
    } catch {
      body = responseText;
    }
  }

  if (!response.ok) {
    throw new ApiError(getErrorMessage(body, response.status), response.status);
  }

  return body as T;
}

function getErrorMessage(body: unknown, status: number): string {
  if (typeof body === "string" && body.trim()) {
    return body;
  }
  if (body && typeof body === "object") {
    const data = body as Record<string, unknown>;
    const message = data.detail ?? data.non_field_errors ?? data.error;
    if (typeof message === "string") {
      return message;
    }
    if (Array.isArray(message)) {
      return message.map(String).join(" ");
    }
    const firstError = Object.values(data).flatMap((value) =>
      Array.isArray(value) ? value : [value],
    )[0];
    if (typeof firstError === "string") {
      return firstError;
    }
  }
  if (status === 401 || status === 403) {
    return "Проверьте логин и пароль или войдите в аккаунт.";
  }
  if (status === 400) {
    return "Проверьте заполненные поля.";
  }
  return `Сервер ответил с ошибкой (${status}). Попробуйте ещё раз.`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character] ?? character;
  });
}

function render(): void {
  if (!app) return;

  app.innerHTML = `
    <div class="site-shell">
      <header class="topbar">
        <a class="brand" href="#" aria-label="Backstage — на главную">
          <span class="brand-mark">B<span>.</span></span>
          <span class="brand-name">BACKSTAGE</span>
        </a>
        <div class="topbar-note"><span class="live-dot"></span> СВОЯ ТУСОВКА. СВОЙ ЗВУК.</div>
        ${
          currentUser
            ? `<button class="text-button" type="button" data-action="logout">Выйти <span aria-hidden="true">↗</span></button>`
            : `<a class="top-link" href="#account">КАБИНЕТ <span aria-hidden="true">↘</span></a>`
        }
      </header>

      <main>
        <section class="hero">
          <div class="hero-copy">
            <p class="eyebrow"><span>01</span> ПЛОЩАДКА ДЛЯ ТВОЕГО ЗВУКА</p>
            <h1>ТВОЯ МУЗЫКА.<br /><span>ТВОИ ПРАВИЛА.</span></h1>
            <p class="hero-description">
              Пространство, где музыканты находят свою группу, свой звук и свою сцену.
              Заполни профиль — и будь на виду.
            </p>
            <a class="hero-cta" href="#account">
              <span>ЗАНЯТЬ МЕСТО В ГРУППЕ</span><span class="cta-arrow">↘</span>
            </a>
            <div class="hero-meta"><span>НЕЗАВИСИМО</span><i></i><span>ГРОМКО</span><i></i><span>ПО-НАСТОЯЩЕМУ</span></div>
          </div>

          <div class="hero-art" aria-label="Графика с музыкальными волнами">
            <div class="art-orbit orbit-one"></div>
            <div class="art-orbit orbit-two"></div>
            <div class="art-disc"><span class="disc-label">SIDE<br />A</span><span class="disc-center"></span></div>
            <div class="art-sticker">TURN<br />IT UP</div>
            <div class="art-caption"><span>EST. IN THE<br />GARAGE</span><span class="caption-star">✳</span></div>
            <div class="waveform" aria-hidden="true">${Array.from({ length: 31 }, (_, index) => `<i style="height:${5 + Math.round((Math.sin(index * 2.4) + 1) * 13)}px"></i>`).join("")}</div>
            <span class="art-index">VOL. 01 — PLAY LOUD</span>
          </div>
        </section>

        <section class="lower-section" id="account">
          <div class="section-intro">
            <p class="eyebrow"><span>02</span> BACKSTAGE PASS</p>
            <h2>${currentUser ? "ТВОЙ<br /><em>БЭКСТЕЙДЖ.</em>" : "СЦЕНА<br /><em>ЖДЁТ ТЕБЯ.</em>"}</h2>
            <p>${currentUser ? "Обнови детали профиля — пусть группа знает, кто сегодня у микрофона." : "Войди или создай аккаунт музыканта, чтобы собрать свой профиль."}</p>
            <div class="mini-stats"><span>01 <small>ПРОФИЛЬ</small></span><b>✳</b><span>∞ <small>ВОЗМОЖНОСТЕЙ</small></span></div>
          </div>
          <div class="account-card">
            ${
              currentUser
                ? renderProfile(currentUser)
                : renderAuth()
            }
          </div>
        </section>
      </main>

      <footer class="footer">
        <a class="brand footer-brand" href="#"><span class="brand-mark">B<span>.</span></span><span class="brand-name">BACKSTAGE</span></a>
        <span>ДЛЯ ТЕХ, КТО ИГРАЕТ ГРОМКО.</span>
        <span>© ${new Date().getFullYear()} BACKSTAGE CLUB</span>
      </footer>
      ${notice ? `<div class="notice notice-${noticeKind}" role="status">${escapeHtml(notice)}</div>` : ""}
    </div>
  `;

  bindEvents();
}

function renderAuth(): string {
  const register = authMode === "register";
  return `
    <div class="card-topline"><span>ТВОЙ ПРОПУСК ЗА КУЛИСЫ</span><span>№ 0${register ? "2" : "1"}</span></div>
    <div class="auth-tabs" role="tablist" aria-label="Авторизация">
      <button type="button" role="tab" aria-selected="${!register}" class="${!register ? "active" : ""}" data-action="login-tab">ВХОД</button>
      <button type="button" role="tab" aria-selected="${register}" class="${register ? "active" : ""}" data-action="register-tab">РЕГИСТРАЦИЯ</button>
    </div>
    <form id="auth-form" class="form">
      <label class="field">
        <span>ИМЯ НА БИЛЕТЕ</span>
        <input name="username" autocomplete="username" required maxlength="150" placeholder="Например, loud_girl" />
      </label>
      <label class="field">
        <span>ПАРОЛЬ</span>
        <input name="password" type="password" autocomplete="${register ? "new-password" : "current-password"}" required minlength="${register ? "6" : "1"}" placeholder="${register ? "Минимум 6 символов" : "Твой пароль"}" />
      </label>
      <button class="submit-button" type="submit" ${busy ? "disabled" : ""}>
        <span>${busy ? "СЕКУНДУ…" : register ? "СОЗДАТЬ АККАУНТ" : "ВОЙТИ В КАБИНЕТ"}</span>
        <span aria-hidden="true">↗</span>
      </button>
    </form>
    <p class="card-footnote"><span>✳</span> Никакого пафоса. Только музыка и люди.</p>
  `;
}

function renderProfile(user: User): string {
  const profile = user.profile;
  return `
    <div class="card-topline"><span>ПРОФИЛЬ МУЗЫКАНТА</span><span>№ ${String(user.id).padStart(2, "0")}</span></div>
    <div class="profile-heading">
      <div class="avatar">${escapeHtml((profile.first_name || user.username).slice(0, 1).toUpperCase())}</div>
      <div><p class="profile-welcome">РАДЫ ВИДЕТЬ ТЕБЯ</p><h3>${escapeHtml(user.username)}</h3></div>
    </div>
    <form id="profile-form" class="form">
      <label class="field">
        <span>КАК К ТЕБЕ ОБРАЩАТЬСЯ</span>
        <input name="first_name" maxlength="100" value="${escapeHtml(profile.first_name ?? "")}" placeholder="Твоё имя" />
      </label>
      <label class="field">
        <span>ТВОЙ ИНСТРУМЕНТ</span>
        <select name="specialization" required>
          ${specializations.map((item) => `<option value="${item.value}" ${profile.specialization === item.value ? "selected" : ""}>${escapeHtml(item.label)}</option>`).join("")}
        </select>
      </label>
      <label class="field">
        <span>ПАРА СЛОВ О СЕБЕ</span>
        <textarea name="bio" rows="3" placeholder="Стиль, опыт, что ищешь…">${escapeHtml(profile.bio ?? "")}</textarea>
      </label>
      <label class="field">
        <span>СТАВКА ЗА ВЫСТУПЛЕНИЕ</span>
        <div class="input-suffix"><input name="fee" inputmode="decimal" pattern="-?\\d{0,8}(\\.\\d{0,2})?" value="${escapeHtml(profile.fee ?? "")}" placeholder="0.00" /><span>₽</span></div>
      </label>
      <button class="submit-button" type="submit" ${busy ? "disabled" : ""}>
        <span>${busy ? "СОХРАНЯЕМ…" : "СОХРАНИТЬ ПРОФИЛЬ"}</span>
        <span aria-hidden="true">↗</span>
      </button>
    </form>
    <p class="card-footnote"><span>✳</span> ${escapeHtml(profile.specialization_display || "Твой профиль")} — это твой звук.</p>
  `;
}

function bindEvents(): void {
  document.querySelector<HTMLButtonElement>('[data-action="login-tab"]')?.addEventListener("click", () => {
    authMode = "login";
    notice = "";
    render();
  });
  document.querySelector<HTMLButtonElement>('[data-action="register-tab"]')?.addEventListener("click", () => {
    authMode = "register";
    notice = "";
    render();
  });
  document.querySelector<HTMLButtonElement>('[data-action="logout"]')?.addEventListener("click", logout);
  document.querySelector<HTMLFormElement>("#auth-form")?.addEventListener("submit", submitAuth);
  document.querySelector<HTMLFormElement>("#profile-form")?.addEventListener("submit", saveProfile);
}

async function submitAuth(event: SubmitEvent): Promise<void> {
  event.preventDefault();
  const form = event.currentTarget;
  if (!(form instanceof HTMLFormElement)) return;
  const formData = new FormData(form);
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  busy = true;
  notice = "";
  render();

  try {
    if (authMode === "register") {
      await request<User>("/api/register/", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      authMode = "login";
      try {
        await request<User>("/api/login/", {
          method: "POST",
          body: JSON.stringify({ username, password }),
        });
        currentUser = await request<User>("/api/profile/");
        noticeKind = "success";
        notice = "Аккаунт создан. Добро пожаловать за кулисы!";
      } catch (error) {
        currentUser = null;
        noticeKind = "info";
        const reason = error instanceof Error ? ` ${error.message}` : "";
        notice = `Аккаунт создан, но автоматический вход не удался.${reason} Войдите вручную.`;
      }
    } else {
      await request<User>("/api/login/", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      currentUser = await request<User>("/api/profile/");
      noticeKind = "success";
      notice = "С возвращением! Ты снова за кулисами.";
    }
  } catch (error) {
    noticeKind = "error";
    notice = error instanceof Error ? error.message : "Не удалось выполнить запрос.";
  } finally {
    busy = false;
    render();
  }
}

async function saveProfile(event: SubmitEvent): Promise<void> {
  event.preventDefault();
  const form = event.currentTarget;
  if (!(form instanceof HTMLFormElement)) return;
  const formData = new FormData(form);
  const fee = String(formData.get("fee") ?? "").trim();
  busy = true;
  notice = "";
  render();

  try {
    currentUser = await request<User>("/api/profile/", {
      method: "PATCH",
      body: JSON.stringify({
        first_name: String(formData.get("first_name") ?? "").trim(),
        specialization: String(formData.get("specialization") ?? ""),
        bio: String(formData.get("bio") ?? "").trim(),
        fee,
      }),
    });
    noticeKind = "success";
    notice = "Профиль обновлён. Так держать!";
  } catch (error) {
    noticeKind = "error";
    notice = error instanceof Error ? error.message : "Не удалось сохранить профиль.";
  } finally {
    busy = false;
    render();
  }
}

async function logout(): Promise<void> {
  busy = true;
  notice = "";
  render();
  try {
    await request<{ detail?: string }>("/api/logout/", { method: "POST" });
    currentUser = null;
    authMode = "login";
    noticeKind = "success";
    notice = "Ты вышел из аккаунта. До встречи на репетиции!";
  } catch (error) {
    noticeKind = "error";
    notice = error instanceof Error ? error.message : "Не удалось выйти из аккаунта.";
  } finally {
    busy = false;
    render();
  }
}

async function initialize(): Promise<void> {
  render();
  const [optionsResult, profileResult] = await Promise.allSettled([
    request<SpecializationOption[]>("/api/specializations/"),
    request<User>("/api/profile/"),
  ]);

  if (optionsResult.status === "fulfilled" && optionsResult.value.length > 0) {
    specializations = optionsResult.value;
  } else if (optionsResult.status === "rejected") {
    noticeKind = "error";
    notice = `Не удалось загрузить список специализаций: ${optionsResult.reason instanceof Error ? optionsResult.reason.message : "ошибка сервера"}`;
  }

  if (profileResult.status === "fulfilled") {
    currentUser = profileResult.value;
    notice = "";
  } else if (
    !(profileResult.reason instanceof ApiError) ||
    (profileResult.reason.status !== 401 && profileResult.reason.status !== 403)
  ) {
    noticeKind = "error";
    notice = profileResult.reason instanceof Error
      ? profileResult.reason.message
      : "Не удалось загрузить профиль.";
  }
  render();
}

void initialize();
