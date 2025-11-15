@echo off
git stash
git pull
git stash pop
git add -A
git commit -m "Add pickup codes system for order verification"
git push

