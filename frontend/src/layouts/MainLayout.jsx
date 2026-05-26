const MainLayout = ({ children }) => {
  return (
    <div className="main-layout">
      <nav>Navbar placeholder</nav>
      <main>{children}</main>
    </div>
  );
};

export default MainLayout;
