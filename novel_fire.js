var name = "NovelFire";
var version = "1.0";
var baseLink = "https://novelfire.net/home";

function getGreeting(id) {
    fetch(baseLink)
        .then(response => response.text())
        .then(html => {
            const dom = $(html);
            const title = dom.find(".nav-logo > a:nth-child(1)").attr("title") || "N/A";

            const response = "Hello from " + name + " at " + version + "! We fetched: " + title;

            app.returnResult(JSON.stringify({id: id, data: response}));
        })
        .catch(error => {
            app.returnResult(JSON.stringify({id: id, data: error.toString() }));
        }).then(() => {
            app.returnResult(JSON.stringify({id: id, data: null, done: true}))
        });
}

function getCarouselItems(id) {
    fetch(baseLink)
        .then(response => response.text())
        .then(html => {
            const dom = $(html);

            dom.find("section.container:nth-child(1) > div:nth-child(2) > ul:nth-child(1) > li.novel-item").each(function() {
                const $el = $(this);
                const title = $el.find("a").attr("title")?.trim();
                const link = $el.find("a").attr("href");
                const cover = $el.find("img").attr("data-src") || $el.find("img").attr("src");

                const rankText = $el.find(".novel-stats span").text().trim();
                const rankMatch = rankText.match(/RANK\s*(\d+)/i);
                const rank = rankMatch ? parseInt(rankMatch[1]) : null;

                const ratingText = $el.find(".badge._br").text().trim();
                const rating = parseFloat(ratingText) || null;

                const novel = {
                    extension: typeof name !== "undefined" ? name : "unknown",
                    title: title || "Untitled",
                    link: link,
                    cover: cover,
                    rank: rank,
                    rating: rating
                };

                app.returnResult(JSON.stringify({ id:id, data: novel }));
            });
        })
        .catch(error => {
            app.returnResult(JSON.stringify({ id:id, error: error.toString() }));
        }).then(() => {
            app.returnResult(JSON.stringify({ id:id, data: null, done: true }));
        });
}


function getHomeItems(id) {
    const link = baseLink.slice(0, -4) + "genre-all/sort-new/status-all/all-novel";

    fetch(link)
        .then(response => response.text())
        .then(html => {
            const dom = $(html);

            dom.find(".novel-item").each(function() {
                const $el = $(this);
                const novel = {
                    extension: name,
                    title: $el.find("a").attr("title"),
                    link: $el.find("a").attr("href"),
                    cover: $el.find("img").attr("data-src"),
                    rank: $el.find(".badge._bl").text().replace(/[^\d]/g, ""),
                    chaptersNumber: $el.find(".novel-stats").text().replace(/[^\d]/g, ""),
                };

                app.log(JSON.stringify(novel));

                app.returnResult(JSON.stringify({ id: id, data: novel }))
            });
        })
        .catch(error => {
            app.returnResult(JSON.stringify({ id:id, error: error.toString() }));
        }).then(() => {
            app.returnResult(JSON.stringify({ id:id, data: null, done: true }));
        });
}

function searchNovels(id, query) {
    const url = `https://novelfire.net/search?keyword=${encodeURIComponent(query)}`;

    app.log(url)

    fetch(url)
        .then(res => res.text())
        .then(html => {
            const dom = $(html);

            dom.find(".horizontal li.novel-item").each(function () {
                const $el = $(this);
                const novel = {
                    extension: name,
                    title: $el.find("h4.novel-title").text().trim(),
                    link: $el.find("a").attr("href"),
                    cover: $el.find("img").attr("data-src") || $el.find("img").attr("src"),
                    rank: $el.find(".novel-stats strong").text().trim(),
                    chaptersNumber: $el.find(".novel-stats span").first().text().trim()
                };

                app.returnResult(JSON.stringify({ id: id, data: novel }));
            });
        })
        .catch(err => {
            app.returnResult(JSON.stringify({ id: id, error: err.toString() }));
        }).then(() => {
            app.returnResult(JSON.stringify({ id: id, data: null, done: true }))
        });
}

function getNovel(id, url) {
    fetch(url)
        .then(res => res.text())
        .then(html => {
            const dom = $(html);

            const novel = {
                extension: name,
                title: dom.find("h1.novel-title").text().trim() || "No Title",
                altTitle: dom.find(".alternative-title").text().trim() || null,
                cover: dom.find(".fixed-img figure.cover img").attr("data-src") || dom.find(".fixed-img figure.cover img").attr("src") || null,
                author: dom.find(".author a").text().trim() || null,
                rank: dom.find(".rank strong").text().trim() || null,
                rating: dom.find(".my-rating").attr("data-rating") || null,
                chaptersNumber: dom.find(".header-stats span:contains('Chapters') strong").text().trim() || null,
                views: dom.find(".header-stats span:contains('Views') strong").text().trim() || null,
                bookmarks: dom.find(".header-stats span:contains('Bookmarked') strong").text().trim() || null,
                status: dom.find(".header-stats span strong.ongoing").length > 0
                    ? "ONGOING"
                    : dom.find(".header-stats span strong.completed").length > 0
                    ? "COMPLETED"
                    : "UNKNOWN",
                genres: dom.find(".categories ul li a.property-item").map(function () {
                    return $(this).text().trim();
                }).get(),
                tags: dom.find(".tags a, .tags span").map(function () {
                    const v = $(this).text().trim();
                    return (v != "Show More" ? v : null)
                }).get(),
                summary: dom.find(".summary .content").text().replace("Show More", "").trim() || null
            };

            app.returnResult(JSON.stringify({ id: id, data: novel }));
        })
        .catch(err => {
            app.returnResult(JSON.stringify({ error: err.toString() }));
        }).then(() => {
            app.returnResult(JSON.stringify({ id: id, data: null, done: true }))
        });
}

function getChapters(id, url) {
    let currentUrl = url + "/chapters";

    function fetchPage(nextUrl) {
        fetch(nextUrl)
            .then(res => res.text())
            .then(html => {
                const allChapters = [];
                const dom = $(html);

                dom.find(".chapter-list li").each(function () {
                    const $a = $(this).find("a");
                    allChapters.push({
                        link: $a.attr("href"),
                        title: $a.find(".chapter-title").text().trim(),
                        update: $a.find(".chapter-update").text().trim()
                    });
                });

                app.returnResult(JSON.stringify({ id:id, data: allChapters }));

                const next = dom.find(".pagination .page-item a[rel='next']").attr("href");

                if (next) {
                    fetchPage(next);
                } else {
                    app.returnResult(JSON.stringify({ id: id, data: null, done: true }))
                }
            })
            .catch(err => {
                app.returnResult(JSON.stringify({ id:id, error: err.toString() }));
            })
    }

    fetchPage(currentUrl)
}

function getChapter(id, url) {
    fetch(url)
        .then(res => res.text())
        .then(html => {
            const dom = $(html);

            // Seleziona l'intero corpo del capitolo
            const content = dom.find("#content")[0];

            let body = '';
            if (content) {
                // Cicla TUTTI i figli (testo, p, i, span, br, ecc.)
                for (let node of content.childNodes) {
                    // Salta nodi pubblicitari o inutili (opzionale)
                    if (
                        node.nodeType === 1 && // ELEMENT_NODE
                        node.classList &&
                        (node.classList.contains('box-ads') || node.classList.contains('py-1'))
                    ) continue;

                    // Se è un nodo di testo o un tag "utile"
                    if (node.nodeType === 3) { // TEXT_NODE
                        const text = node.textContent.trim();
                        if (text) body += text + '\n\n';
                    } else if (node.nodeType === 1) { // ELEMENT_NODE
                        // Solo se non è pubblicità o simili, prendi il testo (con tutto l'eventuale formato)
                        if (!node.classList || (
                            !node.classList.contains('box-ads') && !node.classList.contains('py-1')
                        )) {
                            const text = $(node).text().trim();
                            if (text) body += text + '\n\n';
                        }
                    }
                }
                body = body.trim();
            }

            const chapterData = {
                data: [{ body }]
            };

            app.returnResult(JSON.stringify({ id:id, data: chapterData }));
        })
        .catch(err => {
            app.returnResult(JSON.stringify({ id:id, error: err.toString() }));
        }).then(() => {
            app.returnResult(JSON.stringify({ id:id, data: null, done: true }));
        });
}

