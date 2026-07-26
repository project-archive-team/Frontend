document.addEventListener("DOMContentLoaded", () => {
  // 1. 이메일 로그인 폼 제출 이벤트
  const loginForm = document.getElementById("loginForm");
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault(); // 페이지 새로고침 방지
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    console.log("--- 일반 로그인 시도 ---");
    console.log("이메일:", email);
    console.log("비밀번호:", "*".repeat(password.length));

    // TODO: 서버의 로그인 API (예: POST /api/login) 호출 로직 구현
    alert("로그인을 시도합니다. (콘솔 로그 확인)");
  });

  // 2. 구글 로그인 버튼 이벤트
  const googleLoginBtn = document.getElementById("googleLogin");
  googleLoginBtn.addEventListener("click", () => {
    console.log("Google 로그인 버튼 클릭");
    // TODO: 구글 OAuth 로그인 페이지로 리다이렉트 (예: location.href = '/api/auth/google')
    alert("Google 로그인 페이지로 이동합니다.");
  });

  // 3. 깃허브 로그인 버튼 이벤트
  const githubLoginBtn = document.getElementById("githubLogin");
  githubLoginBtn.addEventListener("click", () => {
    console.log("GitHub 로그인 버튼 클릭");
    // TODO: 깃허브 OAuth 로그인 페이지로 리다이렉트 (예: location.href = '/api/auth/github')
    alert("GitHub 로그인 페이지로 이동합니다.");
  });

  // 4. 회원가입 링크 클릭 이벤트
  const signupLink = document.getElementById("signupLink");
  signupLink.addEventListener("click", (e) => {
    e.preventDefault();
    console.log("회원가입 링크 클릭");
    // TODO: 회원가입 페이지로 이동하는 라우팅 로직 구현
    alert("회원가입 페이지로 이동합니다.");
  });
});
