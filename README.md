# Happy Birthday South

Static birthday card site for `happyBirthdaySouth.ricepud.com`.

## Deploy

Create a GitHub repository named `happyBirthdaySouth` under `ricepud15531`, then push this local repo:

```powershell
cd C:\blog\happyBirthdaySouth
git push -u origin main
```

In the GitHub repository, enable Pages:

```text
Settings -> Pages -> Build and deployment
Source: Deploy from a branch
Branch: main
Folder: / (root)
```

The repository already includes:

```text
CNAME -> happyBirthdaySouth.ricepud.com
.nojekyll
```

Set this DNS record at the domain provider:

```text
Type: CNAME
Host: happyBirthdaySouth
Value: ricepud15531.github.io
```
