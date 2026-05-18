declare global {
    interface Window {
        gameEndObserver?: MutationObserver | null;
        lichessClickHandlerAttached?: boolean;
    }
}

const parser = (pgn: string) => {
    const removeParentheses = (str: string): string => {
        let result = "";
        let level = 0;
        let inParentheses = false;

        for (let i = 0; i < str.length; i++) {
            if (str[i] === "(") {
                level++;
                inParentheses = true;
            } else if (str[i] === ")") {
                level--;
                if (level === 0) {
                    inParentheses = false;
                }
            } else if (!inParentheses) {
                result += str[i];
            }
        }

        return result;
    };

    return removeParentheses(pgn)
        .split(/\s+/) // split by space
        .filter((str) =>
            /^(?:\d+\.+)?(?:[NBRKQ]?[a-h]?[1-8]?x?[a-h][1-8](?:=[QNBR])?|O-O(?:-O)?)[+#]?$/.test(
                str,
            ),
        ) // filter valid moves
        .join("_")
        .replace(/#$/, ""); // remove a trailing '#' to ensure board flip works
};

function lichess() {
    const shareButton = document.querySelector(
        `button[aria-label="Share"]`,
    ) as HTMLElement;

    if (!shareButton) {
        alert("Error: Unable to find PGN...");
        return;
    }

    const pgnObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === "childList") {
                mutation.addedNodes.forEach((node) => {
                    if (node instanceof HTMLElement) {
                        const PGNElement = node.querySelector(`[pgn]`);
                        if (PGNElement) {
                            pgnObserver.disconnect();
                            const closeButton = node.querySelector(
                                `button[aria-label="Close"]`,
                            ) as HTMLButtonElement;

                            const black =
                                document.getElementsByClassName("board flipped")
                                    .length > 0;
                            const moveData = (
                                document
                                    .querySelector("wc-simple-move-list")
                                    ?.getElementsByClassName("selected")[0]
                                    ?.parentElement as HTMLElement
                            )?.dataset.node?.split("-");
                            const openingMove = document.querySelector(
                                "span.eco-opening-name",
                            )?.textContent;

                            let move =
                                openingMove === "Starting Position"
                                    ? 0
                                    : moveData && moveData[0] === "0"
                                      ? String(parseInt(moveData[1], 10) + 1)
                                      : null;

                            closeButton?.click();

                            const PGNData = PGNElement.getAttribute("pgn");
                            if (!PGNData) {
                                throw new Error("PGN not found");
                            }
                            const formatted = parser(PGNData);
                            const link =
                                `https://lichess.org/analysis/pgn/` +
                                formatted +
                                (black ? "?color=black" : "") +
                                `#${move}`;

                            try {
                                if (link) {
                                    window.open(link, "_blank")?.focus();
                                }
                                return;
                            } catch (error) {
                                alert("Error: Something went wrong...");
                                throw new Error("Couldn't open new page");
                            }
                        }
                    }
                });
            }
        });
    });

    shareButton.click();

    pgnObserver.observe(document.body, {
        childList: true,
        subtree: true,
    });
}


const ANALYSIS_LINK_SELECTOR = 'a[href*="/analysis/game/live/"]';

const LICHESS_LABEL = "Lichess Analysis";

function neutralizeHrefs(root: ParentNode = document) {
    root.querySelectorAll<HTMLAnchorElement>(ANALYSIS_LINK_SELECTOR).forEach(
        (anchor) => {
            if (anchor.dataset.lichessHrefStripped === "true") return;
            if (anchor.hasAttribute("href")) {
                anchor.dataset.lichessOriginalHref =
                    anchor.getAttribute("href") || "";
                anchor.removeAttribute("href");
            }
            anchor.style.pointerEvents = "";
            anchor.dataset.lichessHrefStripped = "true";
        },
    );
}

// only buttons with visible text need a rule
// each rule is idempotent with its own data tag
interface LabelRule {
    name: string;
    // selector chain for variant's container, ordered by recency
    // first selector wins, older selectors are used as fallbacks for site refactors
    container: string[];
    // marks processed elements, must be unique
    tag: string;
    // callback
    apply: (el: HTMLElement) => void;
}

const LABEL_RULES: LabelRule[] = [
    // sidebar
    {
        name: "sidebar",
        container: [
            'a[data-cy="sidebar-game-review-button"]',
            'a[aria-label="Game Review"]',
        ],
        tag: "lichessLabelSidebar",
        apply: (anchor) => {
            const label = anchor.querySelector(".cc-button-one-line");
            if (label) {
                label.textContent = LICHESS_LABEL;
                anchor.setAttribute("aria-label", LICHESS_LABEL);
            }
        },
    },

    // popup
    {
        name: "popup",
        container: [".game-over-primary-cta-game-over-primary-cta"],
        tag: "lichessLabelPopup",
        apply: (anchor) => {
            // guard against the sidebar also matching by accident
            if (anchor.querySelector(".cc-button-one-line")) return;
            anchor.textContent = LICHESS_LABEL;
            anchor.setAttribute("aria-label", LICHESS_LABEL);
        },
    },
];

function applyLabelRules(root: ParentNode = document) {
    for (const rule of LABEL_RULES) {
        try {
            for (const selector of rule.container) {
                const matches = root.querySelectorAll<HTMLElement>(selector);
                matches.forEach((el) => {
                    if (el.dataset[rule.tag] === "true") return;
                    rule.apply(el);
                    el.dataset[rule.tag] = "true";
                });
            }
        } catch (err) {
            console.warn(`[lichess-redirect] rule "${rule.name}" threw`, err);
        }
    }
}

function sweep(root: ParentNode = document) {
    neutralizeHrefs(root);
    applyLabelRules(root);
}

function attachClickHandler() {
    if (window.lichessClickHandlerAttached) return;
    window.lichessClickHandlerAttached = true;

    const handler = (e: MouseEvent) => {
        const target = e.target;
        if (!(target instanceof Element)) return;
        // check the live href pattern (in case we got here before neutralizeHrefs ran)
        const link = target.closest<HTMLAnchorElement>(ANALYSIS_LINK_SELECTOR);
        const stripped = target.closest<HTMLElement>(
            '[data-lichess-href-stripped="true"]',
        );
        if (!link && !stripped) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        lichess();
    };

    // capture phase so we beat chess.com's own listeners
    // auxclick covers middle-click; click covers everything else
    document.addEventListener("click", handler, { capture: true });
    document.addEventListener("auxclick", handler, { capture: true });
}

function isLiveGame() {
    return (
        window.location.hostname.includes(`chess.com`) &&
        window.location.pathname.startsWith(`/game/`)
    );
}

function initializeObserver() {
    const observer = new MutationObserver(() => sweep(document));

    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
    });

    window.gameEndObserver = observer;

    // initial pass for elements already in the DOM at load
    sweep(document);
}

function handlePageLoad() {
    if (isLiveGame()) {
        attachClickHandler();
        if (!window.gameEndObserver) {
            initializeObserver();
        } else {
            sweep(document);
        }
    } else {
        if (window.gameEndObserver) {
            window.gameEndObserver.disconnect();
            window.gameEndObserver = null;
        }
    }
}

// @ts-ignore - new navigation API
window.navigation.addEventListener("currententrychange", handlePageLoad);
handlePageLoad();

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === "live") {
        lichess();
        sendResponse({ success: true });
    }
    return true;
});

export {};
