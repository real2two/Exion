// Markdown parser code.
function textParser(text) {
    let oldtext = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    let newtext = "";

    let markdown = {
        bold: false,
        italicized: false,
        underlined: false,
        codeblock: false,
        strikethrough: false,
        spoiler: false,
        quote: false,
        bigcodeblock: false
    };

    while (oldtext.length !== 0) {
        if (oldtext.startsWith("\\") && !oldtext.startsWith("\\ ") && oldtext !== "\\") {
            oldtext = oldtext.slice(1);

            if (Array.isArray(/[\u{1f300}-\u{1f5ff}\u{1f900}-\u{1f9ff}\u{1f600}-\u{1f64f}\u{1f680}-\u{1f6ff}\u{2600}-\u{26ff}\u{2700}-\u{27bf}\u{1f1e6}-\u{1f1ff}\u{1f191}-\u{1f251}\u{1f004}\u{1f0cf}\u{1f170}-\u{1f171}\u{1f17e}-\u{1f17f}\u{1f18e}\u{3030}\u{2b50}\u{2b55}\u{2934}-\u{2935}\u{2b05}-\u{2b07}\u{2b1b}-\u{2b1c}\u{3297}\u{3299}\u{303d}\u{00a9}\u{00ae}\u{2122}\u{23f3}\u{24c2}\u{23e9}-\u{23ef}\u{25b6}\u{23f8}-\u{23fa}\u{200d}]*/ug.exec(oldtext)) && /[\u{1f300}-\u{1f5ff}\u{1f900}-\u{1f9ff}\u{1f600}-\u{1f64f}\u{1f680}-\u{1f6ff}\u{2600}-\u{26ff}\u{2700}-\u{27bf}\u{1f1e6}-\u{1f1ff}\u{1f191}-\u{1f251}\u{1f004}\u{1f0cf}\u{1f170}-\u{1f171}\u{1f17e}-\u{1f17f}\u{1f18e}\u{3030}\u{2b50}\u{2b55}\u{2934}-\u{2935}\u{2b05}-\u{2b07}\u{2b1b}-\u{2b1c}\u{3297}\u{3299}\u{303d}\u{00a9}\u{00ae}\u{2122}\u{23f3}\u{24c2}\u{23e9}-\u{23ef}\u{25b6}\u{23f8}-\u{23fa}\u{200d}]*/ug.exec(oldtext)[0].length !== 0) { // https://stackoverflow.com/questions/43242440/javascript-unicode-emoji-regular-expressions
                const emojiparsed = /[\u{1f300}-\u{1f5ff}\u{1f900}-\u{1f9ff}\u{1f600}-\u{1f64f}\u{1f680}-\u{1f6ff}\u{2600}-\u{26ff}\u{2700}-\u{27bf}\u{1f1e6}-\u{1f1ff}\u{1f191}-\u{1f251}\u{1f004}\u{1f0cf}\u{1f170}-\u{1f171}\u{1f17e}-\u{1f17f}\u{1f18e}\u{3030}\u{2b50}\u{2b55}\u{2934}-\u{2935}\u{2b05}-\u{2b07}\u{2b1b}-\u{2b1c}\u{3297}\u{3299}\u{303d}\u{00a9}\u{00ae}\u{2122}\u{23f3}\u{24c2}\u{23e9}-\u{23ef}\u{25b6}\u{23f8}-\u{23fa}\u{200d}]*/ug.exec(oldtext)[0];

                newtext += emojiparsed;
                oldtext = oldtext.slice(emojiparsed.length);
            } else {
                newtext += oldtext.slice(0, 1);
                oldtext = oldtext.slice(1);
            }
        } else {
            if (newtext == "" && oldtext.startsWith("&gt; ") || oldtext.startsWith("\n&gt; ")) {
                newtext += `<blockquote class="blockquote"><span class="quotecontent">`;
                oldtext = oldtext.slice(oldtext.startsWith("\n&gt; ") ? "\n&gt; ".length : "&gt; ".length);
                markdown.quote = true;
            } else if (oldtext.startsWith("\n") && markdown.quote == true) {
                newtext += "</span></blockquote>"
                oldtext = oldtext.slice(1);
                markdown.quote = false;
            } else if (oldtext.startsWith("**") && !oldtext.startsWith("****")) {
                if (markdown.bold == false) {
                    markdown.bold = true;
                    newtext += "<b>";
                } else {
                    markdown.bold = false;
                    newtext += "</b>";
                };
                oldtext = oldtext.slice(2);
            } else if (oldtext.startsWith("*") && !oldtext.startsWith("**")) {
                if (markdown.italicized == false) {
                    markdown.italicized = true;
                    newtext += "<em>";
                } else {
                    markdown.italicized = false;
                    newtext += "</em>";
                };
                oldtext = oldtext.slice(1);
            } else if (oldtext.startsWith("__") && !oldtext.startsWith("____")) {
                if (markdown.underlined == false) {
                    markdown.underlined = true;
                    newtext += "<u>";
                } else {
                    markdown.underlined = false;
                    newtext += "</u>";
                };
                oldtext = oldtext.slice(2);
            } else if (oldtext.startsWith("```") && !oldtext.startsWith("``````")) {
                if (markdown.bigcodeblock == true) {
                    markdown.bigcodeblock = false;
                    newtext += `</code></pre>`;
                } else {
                    markdown.bigcodeblock = true;
                    newtext += `<pre><code class="bigcodeblocks">`;
                };    

                oldtext = oldtext.slice(3);

                if (oldtext.startsWith("\n")) oldtext = oldtext.slice(1);
            } else if (oldtext.startsWith("`") && !oldtext.startsWith("``")) {
                if (markdown.codeblock == false) {
                    markdown.codeblock = true;
                    newtext += "<code>";
                } else {
                    markdown.codeblock = false;
                    newtext += "</code>";
                };
                oldtext = oldtext.slice(1);
            } else if (oldtext.startsWith("~~") && !oldtext.startsWith("~~~~")) {
                if (markdown.strikethrough == false) {
                    markdown.strikethrough = true;
                    newtext += "<del>";
                } else {
                    markdown.strikethrough = false;
                    newtext += "</del>";
                };
                oldtext = oldtext.slice(2);
            } else if (oldtext.startsWith("||") && !oldtext.startsWith("||||")) {
                if (markdown.spoiler == false) {
                    markdown.spoiler = true;
                    newtext += `<spoiler class=\"spoiler\" onclick=\"openSpoiler(event);\">`;
                } else {
                    markdown.spoiler = false;
                    newtext += "</spoiler>";
                };
                oldtext = oldtext.slice(2);
            } else if (
                Array.isArray(/[\u{1f300}-\u{1f5ff}\u{1f900}-\u{1f9ff}\u{1f600}-\u{1f64f}\u{1f680}-\u{1f6ff}\u{2600}-\u{26ff}\u{2700}-\u{27bf}\u{1f1e6}-\u{1f1ff}\u{1f191}-\u{1f251}\u{1f004}\u{1f0cf}\u{1f170}-\u{1f171}\u{1f17e}-\u{1f17f}\u{1f18e}\u{3030}\u{2b50}\u{2b55}\u{2934}-\u{2935}\u{2b05}-\u{2b07}\u{2b1b}-\u{2b1c}\u{3297}\u{3299}\u{303d}\u{00a9}\u{00ae}\u{2122}\u{23f3}\u{24c2}\u{23e9}-\u{23ef}\u{25b6}\u{23f8}-\u{23fa}\u{200d}]*/ug.exec(oldtext)) &&
                /[\u{1f300}-\u{1f5ff}\u{1f900}-\u{1f9ff}\u{1f600}-\u{1f64f}\u{1f680}-\u{1f6ff}\u{2600}-\u{26ff}\u{2700}-\u{27bf}\u{1f1e6}-\u{1f1ff}\u{1f191}-\u{1f251}\u{1f004}\u{1f0cf}\u{1f170}-\u{1f171}\u{1f17e}-\u{1f17f}\u{1f18e}\u{3030}\u{2b50}\u{2b55}\u{2934}-\u{2935}\u{2b05}-\u{2b07}\u{2b1b}-\u{2b1c}\u{3297}\u{3299}\u{303d}\u{00a9}\u{00ae}\u{2122}\u{23f3}\u{24c2}\u{23e9}-\u{23ef}\u{25b6}\u{23f8}-\u{23fa}\u{200d}]*/ug.exec(oldtext)[0].length !== 0
            ) { // https://stackoverflow.com/questions/43242440/javascript-unicode-emoji-regular-expressions
                let emojiparsed = /[\u{1f300}-\u{1f5ff}\u{1f900}-\u{1f9ff}\u{1f600}-\u{1f64f}\u{1f680}-\u{1f6ff}\u{2600}-\u{26ff}\u{2700}-\u{27bf}\u{1f1e6}-\u{1f1ff}\u{1f191}-\u{1f251}\u{1f004}\u{1f0cf}\u{1f170}-\u{1f171}\u{1f17e}-\u{1f17f}\u{1f18e}\u{3030}\u{2b50}\u{2b55}\u{2934}-\u{2935}\u{2b05}-\u{2b07}\u{2b1b}-\u{2b1c}\u{3297}\u{3299}\u{303d}\u{00a9}\u{00ae}\u{2122}\u{23f3}\u{24c2}\u{23e9}-\u{23ef}\u{25b6}\u{23f8}-\u{23fa}\u{200d}]*/ug.exec(oldtext)[0];
console.log(emojiparsed.length)
                newtext += twemoji.parse(emojiparsed);
                oldtext = oldtext.slice(emojiparsed.length);
            } else {
                newtext += oldtext.slice(0, 1);
                oldtext = oldtext.slice(1);
            };
        };
    };

    if (markdown.bold == true) newtext = removeLastOfThis(newtext, "<b>", "**");
    if (markdown.italicized == true) newtext = removeLastOfThis(newtext, "<em>", "*");
    if (markdown.underlined == true) newtext = removeLastOfThis(newtext, "<u>", "__");
    if (markdown.codeblock == true) newtext = removeLastOfThis(newtext, "<code>", "`");
    if (markdown.strikethrough == true) newtext = removeLastOfThis(newtext, "<del>", "~~");
    if (markdown.spoiler == true) newtext = removeLastOfThis(newtext, `<spoiler class=\"spoiler\" onclick=\"openSpoiler(event);\">"`, "||");
    if (markdown.quote == true) newtext += "</span></blockquote>";
    if (markdown.bigcodeblock == true) newtext = removeLastOfThis(newtext, `<pre><code class="bigcodeblocks">`, "```");

    return createTextLinks_(newtext.replace(/\n/g, "<br>"));
};

function removeLastOfThis(text, find, replace) {
    let removelast = text;
    let removedlast = "";

    while (removelast.length !== 0) {
        if (removelast.endsWith(find)) {
            removedlast = removelast.slice(0, -(find.length)) + replace + removedlast;
            removelast = "";
        } else {
            removedlast = removelast.slice(-1) + removedlast;
            removelast = removelast.slice(0, -1);
        };
    };
    return removedlast;
};

//https://www.labnol.org/code/20294-regex-extract-links-javascript

function createTextLinks_(text) {
    return (text || "").replace(
        /([^\S]|^)(((https?\:\/\/)|(www\.))(\S+))/gi,
            function(match, space, url) {
                let hyperlink = url;
                if (!hyperlink.match('^https?:\/\/')) {
                    hyperlink = 'http://' + hyperlink;
                }
                return space + '<a href="' + hyperlink + '" target="_blank">' + url + '</a>';
        }
    );
};