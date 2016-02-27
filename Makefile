all: bundle minify
bundle:
	browserify src/app.js -o build/space-ai.js
minify:
	uglifyjs build/space-ai.js -c -m -o build/space-ai.min.js
clean:
	rm build/*.js
