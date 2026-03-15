// firebase-admin-example.java
// 사용자가 보내준 Admin SDK 방식 예제입니다.
// 이 방식은 서버/백엔드(Java)에서만 사용해야 하며,
// 브라우저의 HTML/JS 페이지에 직접 넣으면 안 됩니다.

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;

import java.io.FileInputStream;

public class FirebaseAdminInitExample {
    public static void main(String[] args) throws Exception {
        FileInputStream serviceAccount =
            new FileInputStream("path/to/serviceAccountKey.json");

        FirebaseOptions options = new FirebaseOptions.Builder()
            .setCredentials(GoogleCredentials.fromStream(serviceAccount))
            .build();

        FirebaseApp.initializeApp(options);

        System.out.println("Firebase Admin SDK initialized.");
    }
}
