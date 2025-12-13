# commit command

1. git status와 git diff로 변경사항 파악
2. 작업내용이 현재 브랜치와 어울리지 않다면(혹은 추가적인 브랜치 생성이 필요하다고 판단되면) 커밋 하기전에 "브랜치 변경" 혹은 "생성" 제안
3. 작업내용이 많다면, 작업 단위 여러 커밋으로 분할해서 커밋
4. 커밋 메시지는 코드나 문서 내 인용을 제외하고 반드시 한글로 작성
5. 커밋 형식 적용(커밋 형식은 아래 커밋 형식을 따름)
6. 커밋 체크리스트 확인 하기
7. 적절한 커밋 메시지 작성 후 커밋 실행

## 커밋 형식

```
[emoji] [type]([scope]): [title]

[body]

[issue tracker]
```

### Emoji & Type

- 아래 표에 맞는 적절한 emoji & type 사용
- 커밋 내용이 아래 타입 중 어느것에도 해당하지 않을 시

## 📄 Commit Convention Table (Markdown)

|         Type          | Description                                                                                                                 | Emoji | 사용 예시 (Example)                                                                                  |
| :-------------------: | :-------------------------------------------------------------------------------------------------------------------------- | :---: | :--------------------------------------------------------------------------------------------------- |
|        `docs`         | 단순 문서 추가 및 수정                                                                                                      |  📜   | `📜 docs(readme): Update installation instructions`                                                  |
|        `feat`         | 새로운 기능 추가                                                                                                            |  ✨   | `✨ feat(user-auth): Implement social media login`                                                   |
|         `fix`         | 버그 수정                                                                                                                   |  🐛   | `🐛 fix(data-processing): Resolve null pointer issue`                                                |
|        `perf`         | 성능 개선                                                                                                                   |  ⚡   | `⚡ perf(api): Optimize database query for faster response`                                          |
| `refactor` or `style` | 기능 추가(feat), 버그 수정(fix), 성능 개선(perf)을 제외한 코드 수정 / code style 변경(Code Formatting, 세미콜론(;) 누락 등) | ♻️ 🎨 | `♻️ refactor(api): Simplify error handling`<br>`🎨 style: Format code according to style guidelines` |
|        `test`         | test code, refactoring test code 추가                                                                                       |  ✅   | `✅ test(api): Add unit tests for authentication service`                                            |
|       `revert`        | 이전 커밋으로 회귀할 때                                                                                                     |  ⏪   | `⏪ revert: Undo last commit`                                                                        |
|        `build`        | 빌드 파일 또는 외부 종속성에 영향을 미치는 수정                                                                             |  📦   |                                                                                                      |
|         `ci`          | CI 설정 파일 수정                                                                                                           |  ⚙️   |                                                                                                      |
|        `chore`        | 빌드 업무 수정, 패키지 매니저 수정(.gitignore 같은 경우)                                                                    | ⬆️⬇️  | `⬆️⬇️ chore(dependencies): Update axios to version 1.6.4`                                            |
|       `rename`        | 파일 혹은 폴더명을 수정한 경우                                                                                              |  🚚   | `🚚 rename: Change component file names`                                                             |
|       `remove`        | 파일을 삭제한 경우                                                                                                          |  🔥   | `🔥 remove: Delete obsolete utility functions`                                                       |

### Scope(Optional)

- 커밋이 어떤 부분에 영향을 미쳤는지를 나타냅니다.
- 이 부분은 선택적이며, 변경 사항의 범위를 더 명시적으로 표현할 때 사용됩니다.
- 함수나 메소드를 직접적으로 명시하기도 합니다.

### Title

- 커밋의 간단한 한 줄 요약으로, 50자 이내로 작성하는 것이 좋습니다.
- 끝에 마침표를 붙이지 않습니다.
- 변경 사항의 핵심을 나타내야 합니다.

### Body

- 커밋에 대한 자세한 설명이나 배경을 기술하는 부분입니다.
- 변경 사항을 더 자세히 설명할 수 있도록 도움이 되어야 합니다.
- **절대 크레딧을 작성하지 않습니다.**

### Issue Tracker(Optional)

- 주로 커밋과 관련된 이슈 트래킹, 변경 사항의 영향 등에 대한 추가적인 정보를 기록하는 데 사용됩니다.
- 이 부분은 선택적입니다. 해당하는 이슈가 없다면 작성하지 않습니다.
- 아래 시나리오를 참고해 작성하세요.
  - resolves(관련 이슈 해결): 이 커밋이 특정 이슈를 해결한다는 것을 명시합니다.
  - refs(참조) : 이 커밋이 특정 이슈를 참조한다는 것을 명시합니다.
  - closes(이슈 닫힘) : 이 커밋이 특정 이슈를 해결했으며, 해당 이슈를 닫을 때 사용합니다.

## 커밋 체크리스트

| step | checklist             | example                                |
| ---- | --------------------- | -------------------------------------- |
| 1️⃣   | 작은 단위로 커밋했나? | 한 번에 하나의 기능만 변경             |
| 2️⃣   | 코드가 정상 동작하나? | 커밋 전 반드시 테스트                  |
| 3️⃣   | 메시지가 명확한가?    | 다른 사람이 봐도 이해할 수 있는지 확인 |

## 커밋 예시

```
✨ feat(인증): 사용자 인증 기능 추가

- 사용자 인증 기능 구현.
- 사용자 자격 증명을 유효성 검사하여 보안 강화.
- 인증 모듈을 사용자 데이터베이스와 연결.

Resolves: #567
```
