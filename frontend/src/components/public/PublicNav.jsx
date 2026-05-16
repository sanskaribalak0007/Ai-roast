function PublicNav({ routeType, onNavigate }) {
  return (
    <nav className="public-nav">
      <button className={routeType === "auth" ? "active" : ""} onClick={() => onNavigate("auth")} type="button">
        Home
      </button>
      <button className={routeType === "about" ? "active" : ""} onClick={() => onNavigate("about")} type="button">
        About Us
      </button>
      <button className={routeType === "help" ? "active" : ""} onClick={() => onNavigate("help")} type="button">
        Help & Contact
      </button>
    </nav>
  );
}

export default PublicNav;
