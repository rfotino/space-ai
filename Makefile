all: bundle minify
watch:
	webpack --watch src/app.js build/space-ai.js
bundle:
	webpack src/app.js build/space-ai.js
minify:
	uglifyjs build/space-ai.js -c -m -o build/space-ai.min.js
clean:
	rm build/*.js
