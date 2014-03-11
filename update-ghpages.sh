#!/bin/bash

grunt dev || exit 1;
npm test || exit 1;

cp -R dist/ .dist/;

git checkout gh-pages || exit 1;

git ls-files | xargs -I {} rm "{}";

cp -R .dist/* .;

for FILE in dist/*; do
	echo $FILE | cut -d'/' -f2- | xargs -I {} git add --all "{}";
done;

rm -r .dist/;
git commit -m "Update gh-pages.";

git co master;
