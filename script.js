(() => {
    const locale = document.documentElement.lang === "ar" ? "ar" : "nl";
    const i18n = {
        nl: {
            partialWarningTitle: "Let op",
            partialWarningBody:
                "Header/footer konden niet geladen worden. Controleer of je de site via een webserver bekijkt (niet als losse file) en of <code>{url}</code> bestaat.",
            donateSelectAmount: "Selecteer eerst een bedrag.",
            donateThanks: "Bedankt! Dit is een demo: er is geen betaling uitgevoerd.",
            donateChooseAmount: "Kies een bedrag om je donatie te simuleren.",
            donateRecurring: "maandelijks",
            donateOnce: "eenmalig",
            contactNeedFormId: "Vul eerst je Formspree formulier-ID in.",
            contactEmailInvalid: "Vul een e-mailadres met @ in.",
            contactSending: "Verzenden...",
            contactSent: "Bedankt! Je bericht is verzonden.",
            contactFailed: "Verzenden is mislukt. Probeer het later opnieuw.",
            contactFailedGeneric: "Versturen mislukt",
        },
        ar: {
            partialWarningTitle: "تنبيه",
            partialWarningBody:
                "تعذر تحميل رأس/تذييل الصفحة. تحقّق من أنك تعرض الموقع عبر خادم ويب (وليس كملف منفصل) وأن <code>{url}</code> موجود.",
            donateSelectAmount: "يرجى اختيار مبلغ أولاً.",
            donateThanks: "شكراً لك! هذا عرض تجريبي: لم يتم تنفيذ أي دفع.",
            donateChooseAmount: "اختر مبلغاً لمحاكاة تبرعك.",
            donateRecurring: "شهرياً",
            donateOnce: "مرة واحدة",
            contactNeedFormId: "يرجى إدخال معرّف نموذج Formspree أولاً.",
            contactEmailInvalid: "يرجى إدخال بريد إلكتروني يحتوي على @.",
            contactSending: "جارٍ الإرسال...",
            contactSent: "شكراً لك! تم إرسال رسالتك.",
            contactFailed: "فشل الإرسال. حاول مرة أخرى لاحقاً.",
            contactFailedGeneric: "فشل الإرسال",
        },
    };

    function t(key, vars) {
        let value = i18n[locale]?.[key] || i18n.nl[key] || "";
        if (vars) {
            Object.entries(vars).forEach(([k, v]) => {
                value = value.replace(new RegExp(`\\{${k}\\}`, "g"), v);
            });
        }
        return value;
    }

    async function loadPartial(targetId, url) {
        const target = document.getElementById(targetId);
        if (!target) return;

        try {
            const res = await fetch(url, { cache: "no-store" });
            if (!res.ok) throw new Error(`HTTP ${res.status} bij ${url}`);
            target.innerHTML = await res.text();
        } catch (err) {
            console.warn(err);
            target.innerHTML = `
        <div class="section section--tight">
          <div class="container">
            <div class="card card--flat">
              <strong>${t("partialWarningTitle")}</strong>
              <p class="text-muted" style="margin-top:.35rem;">
                ${t("partialWarningBody", { url })}
              </p>
            </div>
          </div>
        </div>
      `;
        }
    }

    function setActiveNav() {
        const page = document.body.dataset.page;
        if (!page) return;

        const link = document.querySelector(`.nav a[data-nav="${page}"]`);
        if (link) {
            link.classList.add("active");
            link.setAttribute("aria-current", "page");
        }
    }

    function initMobileNav() {
        const btn = document.querySelector(".nav-toggle");
        const nav = document.getElementById("primary-nav");
        if (!btn || !nav) return;

        btn.addEventListener("click", () => {
            const expanded = btn.getAttribute("aria-expanded") === "true";
            btn.setAttribute("aria-expanded", String(!expanded));
            nav.classList.toggle("is-open", !expanded);
        });

        nav.querySelectorAll("a").forEach((a) => {
            a.addEventListener("click", () => {
                nav.classList.remove("is-open");
                btn.setAttribute("aria-expanded", "false");
            });
        });
    }

    function initFooterYear() {
        const el = document.getElementById("year");
        if (el) el.textContent = new Date().getFullYear();
    }

    function initLangSwitch() {
        const wrapper = document.querySelector(".lang-switch");
        if (!wrapper) return;

        const nlLink = wrapper.querySelector('.lang-switch__link[data-lang="nl"]');
        const arLink = wrapper.querySelector('.lang-switch__link[data-lang="ar"]');
        const path = window.location.pathname;
        let file = path.split("/").pop() || "index.html";

        if (!file.includes(".html")) file = "index.html";

        let nlTarget = file;
        let arTarget = file;

        if (file.endsWith("-ar.html")) {
            nlTarget = file.replace("-ar.html", ".html");
            arTarget = file;
        } else {
            nlTarget = file;
            arTarget = file.replace(/\.html$/, "-ar.html");
        }

        if (nlLink) nlLink.href = nlTarget;
        if (arLink) arLink.href = arTarget;

        if (nlLink) nlLink.removeAttribute("aria-current");
        if (arLink) arLink.removeAttribute("aria-current");

        if (locale === "ar" || file.endsWith("-ar.html")) {
            if (arLink) arLink.setAttribute("aria-current", "true");
        } else if (nlLink) {
            nlLink.setAttribute("aria-current", "true");
        }
    }

    function money(value) {
        const formatLocale = locale === "ar" ? "ar-MA" : "nl-NL";
        return new Intl.NumberFormat(formatLocale, {
            style: "currency",
            currency: "EUR",
        }).format(value);
    }

    function showToast(message, type = "info") {
        let toast = document.getElementById("toast");
        if (!toast) {
            toast = document.createElement("div");
            toast.id = "toast";
            toast.className = "toast";
            toast.setAttribute("role", "status");
            toast.setAttribute("aria-live", "polite");
            document.body.appendChild(toast);
        }

        toast.textContent = message;
        toast.dataset.type = type;
        toast.classList.add("is-visible");

        clearTimeout(showToast._t);
        showToast._t = setTimeout(() => toast.classList.remove("is-visible"), 4200);
    }

    function initDonateForm() {
        const form = document.querySelector("[data-donate-form]");
        if (!form) return;

        const customInput = form.querySelector("#donatie-bedrag-custom");
        const radios = form.querySelectorAll('input[name="donatie-bedrag"]');
        const typeRadios = form.querySelectorAll('input[name="donatie-type"]');
        const summary = document.getElementById("donatie-samenvatting");

        function getSelectedAmount() {
            const checked = [...radios].find((r) => r.checked);
            if (!checked) return null;

            if (checked.value === "custom") {
                const raw = (customInput?.value || "").replace(",", ".");
                const val = parseFloat(raw);
                return Number.isFinite(val) && val > 0 ? val : null;
            }

            const val = parseFloat(checked.value);
            return Number.isFinite(val) && val > 0 ? val : null;
        }

        function getType() {
            const checked = [...typeRadios].find((r) => r.checked);
            return checked ? checked.value : "eenmalig";
        }

        function updateSummary() {
            if (!summary) return;

            const amount = getSelectedAmount();
            const type = getType();

            if (!amount) {
                summary.textContent = t("donateChooseAmount");
                return;
            }

            summary.textContent = `${money(amount)} (${
                type === "maandelijks" ? t("donateRecurring") : t("donateOnce")
            })`;
        }

        radios.forEach((r) =>
            r.addEventListener("change", () => {
                if (r.value !== "custom" && customInput) customInput.value = "";
                updateSummary();
            })
        );

        if (customInput) {
            customInput.addEventListener("input", () => {
                const customRadio = form.querySelector(
                    'input[name="donatie-bedrag"][value="custom"]'
                );
                if (customRadio) customRadio.checked = true;
                updateSummary();
            });
        }

        typeRadios.forEach((r) => r.addEventListener("change", updateSummary));

        form.addEventListener("submit", (e) => {
            e.preventDefault();

            const amount = getSelectedAmount();
            if (!amount) {
                showToast(t("donateSelectAmount"), "warn");
                return;
            }

            showToast(t("donateThanks"), "success");
        });

        updateSummary();
    }

    function initContactForm() {
        const form = document.querySelector("[data-contact-form]");
        if (!form) return;

        form.addEventListener("submit", async (e) => {
            e.preventDefault();

            const formData = new FormData(form);
            const endpoint =
                form.getAttribute("action") || form.action || "";
            const name = String(formData.get("name") || "").trim();
            const email = String(formData.get("contact_email") || "").trim();
            const subject = String(formData.get("subject") || "").trim();
            const message = String(formData.get("message") || "").trim();
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalLabel = submitBtn ? submitBtn.textContent : "";

            if (!endpoint || endpoint.includes("YOUR_FORM_ID")) {
                showToast(t("contactNeedFormId"), "warn");
                return;
            }

            if (!email.includes("@")) {
                showToast(t("contactEmailInvalid"), "warn");
                return;
            }

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = t("contactSending");
            }

            try {
                const res = await fetch(endpoint, {
                    method: "POST",
                    headers: { "Accept": "application/json" },
                    body: formData,
                });

                const data = await res.json().catch(() => ({}));
                if (!res.ok || data?.errors?.length) {
                    const first = data?.errors?.[0]?.message;
                    throw new Error(first || data.message || data.error || t("contactFailedGeneric"));
                }

                form.reset();
                showToast(t("contactSent"), "success");
            } catch (err) {
                console.warn(err);
                showToast(t("contactFailed"), "warn");
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalLabel;
                }
            }
        });
    }

    async function boot() {
        await Promise.all([
            loadPartial(
                "site-header",
                locale === "ar" ? "partials/header-ar.html" : "partials/header.html"
            ),
            loadPartial(
                "site-footer",
                locale === "ar" ? "partials/footer-ar.html" : "partials/footer.html"
            ),
        ]);

        setActiveNav();
        initMobileNav();
        initLangSwitch();
        initFooterYear();
        initDonateForm();
        initContactForm();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", boot);
    } else {
        boot();
    }
})();
