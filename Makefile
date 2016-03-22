all: bundle minify docs-js
watch:
	webpack --watch src/app.js build/space-ai.js
bundle:
	webpack src/app.js build/space-ai.js
minify:
	uglifyjs build/space-ai.js -c -m -o build/space-ai.min.js
docs-js:
	cat lib/jquery/jquery.js lib/codemirror/lib/codemirror.js \
	    lib/codemirror/mode/javascript/javascript.js > docs/docs.js
	uglifyjs docs/docs.js -c -m -o docs/docs.min.js
clean:
	rm build/*.js docs/*.js
