import { NavLink } from "react-router-dom";

function Navbar() {
  return (
    <header className="top-navbar">
      <div className="brand-block">
        <div className="brand-logo">BB</div>

        <div>
          <h2>BabyBargains</h2>
          <p>Enterprise Inventory System</p>
        </div>
      </div>

      <nav className="top-nav-links">
        <NavLink to="/" end className="nav-item">
          Dashboard
        </NavLink>

        <NavLink to="/branches" className="nav-item">
          Master Data
        </NavLink>

        <NavLink to="/inventory" className="nav-item">
          Inventory Management
        </NavLink>

        <NavLink to="/sales" className="nav-item">
          Sales Operations
        </NavLink>

        <NavLink to="/orders" className="nav-item">
          Procurement
        </NavLink>

        <NavLink to="/stocktakes" className="nav-item">
          Stock Control
        </NavLink>

        <NavLink to="/products" className="nav-item">
          Product Catalogue
        </NavLink>
      </nav>
    </header>
  );
}

export default Navbar;