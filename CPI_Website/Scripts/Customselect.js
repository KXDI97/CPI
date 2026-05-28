    
    export class CustomSelect {
    /**
     * @param {HTMLSelectElement} selectEl  — el <select> original
     * @param {object} [opts]
     * @param {string} [opts.placeholder]   — texto cuando no hay nada seleccionado
     * @param {function} [opts.onChange]    — callback(value, text) al cambiar
     */
    constructor(selectEl, opts = {}) {
        if (!selectEl || selectEl.tagName !== "SELECT") {
        throw new Error("CustomSelect: se necesita un <select>");
        }
        this._sel   = selectEl;
        this._opts  = opts;
        this._open  = false;
        this._build();
    }

    // ── Build ────────────────────────────────────────────────────────────────
    _build() {
        // Ocultar el select original pero mantenerlo en el DOM (formularios siguen funcionando)
        this._sel.style.display = "none";

        // Wrapper
        this._wrapper = document.createElement("div");
        this._wrapper.className = "cs-wrapper";
        if (this._sel.required) this._wrapper.dataset.required = "true";

        // Trigger (lo que ve el usuario)
        this._trigger = document.createElement("button");
        this._trigger.type = "button";
        this._trigger.className = "cs-trigger";
        this._trigger.setAttribute("aria-haspopup", "listbox");
        this._trigger.setAttribute("aria-expanded", "false");

        this._triggerText = document.createElement("span");
        this._triggerText.className = "cs-trigger-text";

        this._triggerArrow = document.createElement("span");
        this._triggerArrow.className = "cs-trigger-arrow";
        this._triggerArrow.innerHTML = `<svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`;

        this._trigger.append(this._triggerText, this._triggerArrow);

        // Dropdown
        this._dropdown = document.createElement("div");
        this._dropdown.className = "cs-dropdown";
        this._dropdown.setAttribute("role", "listbox");

        // Search dentro del dropdown (solo si hay ≥6 opciones)
        this._searchWrap = null;
        this._searchInput = null;

        this._listWrap = document.createElement("div");
        this._listWrap.className = "cs-list";

        this._dropdown.appendChild(this._listWrap);
        this._wrapper.append(this._trigger, this._dropdown);

        // Insertar justo después del select original
        this._sel.insertAdjacentElement("afterend", this._wrapper);

        this._renderOptions();
        this._syncFromSelect();
        this._bindEvents();
    }

    // ── Render opciones ──────────────────────────────────────────────────────
    _renderOptions(filter = "") {
        this._listWrap.innerHTML = "";
        const options = Array.from(this._sel.options);
        const q = filter.toLowerCase();

        // Search bar si hay muchas opciones
        const realOpts = options.filter(o => o.value !== "");
        if (realOpts.length >= 6 && !this._searchWrap) {
        this._searchWrap = document.createElement("div");
        this._searchWrap.className = "cs-search-wrap";
        this._searchInput = document.createElement("input");
        this._searchInput.type = "text";
        this._searchInput.className = "cs-search-input";
        this._searchInput.placeholder = "Buscar…";
        this._searchInput.autocomplete = "off";
        this._searchInput.addEventListener("input", e => {
            this._renderOptions(e.target.value);
        });
        this._searchInput.addEventListener("keydown", e => e.stopPropagation());
        this._searchWrap.appendChild(this._searchInput);
        this._dropdown.insertBefore(this._searchWrap, this._listWrap);
        }

        let anyVisible = false;
        options.forEach(opt => {
        if (q && !opt.text.toLowerCase().includes(q)) return;
        anyVisible = true;

        const item = document.createElement("div");
        item.className = "cs-option";
        item.dataset.value = opt.value;
        item.textContent = opt.text;
        item.setAttribute("role", "option");

        if (opt.value === "") {
            item.classList.add("cs-option--placeholder");
        }
        if (opt.value === this._sel.value) {
            item.classList.add("cs-option--selected");
            item.setAttribute("aria-selected", "true");
        }
        if (opt.disabled) {
            item.classList.add("cs-option--disabled");
        }

        item.addEventListener("mousedown", e => {
            e.preventDefault();
            if (opt.disabled) return;
            this._select(opt.value, opt.text);
        });

        this._listWrap.appendChild(item);
        });

        if (!anyVisible) {
        const empty = document.createElement("div");
        empty.className = "cs-option cs-option--empty";
        empty.textContent = "Sin resultados";
        this._listWrap.appendChild(empty);
        }
    }

    // ── Seleccionar valor ────────────────────────────────────────────────────
    _select(value, text) {
        this._sel.value = value;
        this._sel.dispatchEvent(new Event("change", { bubbles: true }));
        this._syncFromSelect();
        this._close();
        if (this._opts.onChange) this._opts.onChange(value, text);
    }

    // ── Sincronizar texto del trigger desde el <select> ──────────────────────
    _syncFromSelect() {
        const sel   = this._sel;
        const opt   = sel.options[sel.selectedIndex];
        const text  = opt ? opt.text : (this._opts.placeholder || "Seleccione…");
        const isEmpty = !sel.value;

        this._triggerText.textContent = text;
        this._triggerText.classList.toggle("cs-trigger-text--placeholder", isEmpty);

        // Marcar selected en lista
        this._listWrap.querySelectorAll(".cs-option").forEach(el => {
        const isSelected = el.dataset.value === sel.value;
        el.classList.toggle("cs-option--selected", isSelected);
        el.setAttribute("aria-selected", String(isSelected));
        });
    }

    // ── Abrir / cerrar ───────────────────────────────────────────────────────
    _open_() {
        if (this._open) return;
        this._open = true;

        // Cerrar cualquier otro CustomSelect abierto
        document.querySelectorAll(".cs-wrapper.cs-open").forEach(w => {
        if (w !== this._wrapper) w.__csInstance?._close();
        });

        this._wrapper.classList.add("cs-open");
        this._trigger.setAttribute("aria-expanded", "true");

        // Refrescar lista por si cambiaron las opciones del select
        this._renderOptions(this._searchInput?.value || "");
        this._syncFromSelect();

        // Posicionar dropdown arriba o abajo según espacio
        requestAnimationFrame(() => {
        const trigRect = this._trigger.getBoundingClientRect();
        const spaceBelow = window.innerHeight - trigRect.bottom;
        const spaceAbove = trigRect.top;
        const dropH = Math.min(240, this._dropdown.scrollHeight);

        if (spaceBelow < dropH + 8 && spaceAbove > spaceBelow) {
            this._dropdown.classList.add("cs-dropdown--up");
        } else {
            this._dropdown.classList.remove("cs-dropdown--up");
        }

        // Scroll al elemento seleccionado
        const selected = this._listWrap.querySelector(".cs-option--selected");
        if (selected) selected.scrollIntoView({ block: "nearest" });
        });

        if (this._searchInput) {
        setTimeout(() => this._searchInput.focus(), 50);
        }
    }

    _close() {
        if (!this._open) return;
        this._open = false;
        this._wrapper.classList.remove("cs-open");
        this._trigger.setAttribute("aria-expanded", "false");
        if (this._searchInput) this._searchInput.value = "";
        this._renderOptions();
    }

    // ── Eventos ──────────────────────────────────────────────────────────────
    _bindEvents() {
        this._wrapper.__csInstance = this;

        this._trigger.addEventListener("click", () => {
        this._open ? this._close() : this._open_();
        });

        // Cerrar al hacer click fuera
        this._outsideHandler = e => {
        if (!this._wrapper.contains(e.target)) this._close();
        };
        document.addEventListener("mousedown", this._outsideHandler);

        // Teclado
        this._trigger.addEventListener("keydown", e => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); this._open ? this._close() : this._open_(); }
        if (e.key === "Escape") this._close();
        if (e.key === "ArrowDown") { e.preventDefault(); this._open_(); this._focusFirst(); }
        });

        // Observar cambios en el <select> original (ej: cuando JS carga opciones)
        this._mutationObserver = new MutationObserver(() => {
        this._renderOptions(this._searchInput?.value || "");
        this._syncFromSelect();
        });
        this._mutationObserver.observe(this._sel, { childList: true, subtree: true, attributes: true });
    }

    _focusFirst() {
        const first = this._listWrap.querySelector(".cs-option:not(.cs-option--disabled):not(.cs-option--placeholder)");
        first?.focus();
    }

    // ── API pública ──────────────────────────────────────────────────────────

    /** Obtiene el valor actual */
    getValue() { return this._sel.value; }

    /** Setea el valor por código */
    setValue(val) {
        this._sel.value = val;
        this._syncFromSelect();
    }

    /** Reconstruye las opciones (llamar si el <select> cambió externamente) */
    rebuild() {
        if (this._searchWrap) {
        this._searchWrap.remove();
        this._searchWrap = null;
        this._searchInput = null;
        }
        this._renderOptions();
        this._syncFromSelect();
    }

    /** Destruye el custom select y restaura el original */
    destroy() {
        document.removeEventListener("mousedown", this._outsideHandler);
        this._mutationObserver.disconnect();
        this._wrapper.remove();
        this._sel.style.display = "";
    }
    }


    // ── Auto-init helper ─────────────────────────────────────────────────────────
    // Llama initCustomSelects() para convertir todos los <select> de un contenedor.

    /**
     * Convierte todos los <select> dentro de `root` en CustomSelect.
     * Devuelve un Map<HTMLSelectElement, CustomSelect> para acceder a las instancias.
     * @param {HTMLElement|Document} [root=document]
     * @param {string} [selector="select"]
     * @returns {Map<HTMLSelectElement, CustomSelect>}
     */
    export function initCustomSelects(root = document, selector = "select") {
    const map = new Map();
    root.querySelectorAll(selector).forEach(sel => {
        // No doble-inicializar
        if (sel.nextElementSibling?.classList.contains("cs-wrapper")) return;
        try {
        const cs = new CustomSelect(sel);
        map.set(sel, cs);
        } catch(e) {
        console.warn("CustomSelect skip:", sel, e);
        }
    });
    return map;
    }