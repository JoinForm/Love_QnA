# 마음 질문 사이트 (Firebase 연동 준비 버전)

## 이번 수정 사항
- index 화면에 D+100, D+365 날짜 추가
- 상대방 이름을 전부 `예지`로 변경
- Firebase Firestore 연동 구조 추가
- Firebase 설정 전에는 localStorage로 동작
- Firebase 설정 후에는 Firestore DB로 동작

## 중요한 점
사용자가 보내준 아래 코드는 **Java Admin SDK** 방식입니다.

```java
FileInputStream serviceAccount =
new FileInputStream("path/to/serviceAccountKey.json");

FirebaseOptions options = new FirebaseOptions.Builder()
  .setCredentials(GoogleCredentials.fromStream(serviceAccount))
  .build();

FirebaseApp.initializeApp(options);
```

이 코드는 **서버/백엔드 전용**입니다.  
즉, HTML/JS 브라우저 페이지 안에 직접 넣을 수 없습니다.

그래서 이 프로젝트는 이렇게 구성했습니다.

- 프론트엔드(브라우저): `firebase-config.js` + Firebase Web SDK + Firestore
- 백엔드 참고 예제: `firebase-admin-example.java`

## 실행 방법
1. 압축을 해제합니다.
2. 우선은 그냥 `index.html`을 열면 localStorage로 동작합니다.
3. Firebase 연결하려면 `firebase-config.js` 파일을 수정합니다.
4. `FIREBASE_ENABLED = true` 로 바꿉니다.
5. Firebase Console의 Web 앱 설정값을 입력합니다.
6. Firestore Database를 생성합니다.

## firebase-config.js 수정 예시
```js
export const FIREBASE_ENABLED = true;

export const firebaseWebConfig = {
  apiKey: "실제값",
  authDomain: "실제값",
  projectId: "실제값",
  storageBucket: "실제값",
  messagingSenderId: "실제값",
  appId: "실제값"
};

export const FIRESTORE_COLLECTION = "love_qna_questions";
```

## Firestore 권한 규칙(테스트용)
초기 테스트용으로는 아래처럼 쓸 수 있습니다.

```txt
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /love_qna_questions/{document=**} {
      allow read, write: if true;
    }
  }
}
```

주의: 이 규칙은 테스트용입니다. 실제 배포 시에는 인증/권한 제한이 필요합니다.

## 파일 구성
- `index.html`
- `my-page.html`
- `partner-page.html`
- `style.css`
- `app.js`
- `firebase-config.js`
- `firebase-admin-example.java`
- `README.txt`
