import React from 'react';
import { Search, Menu, Sun, Moon, ShoppingCart, Heart, User } from 'lucide-react';
const Header = ({ colors, theme, searchQuery, setSearchQuery, setShowMenu, toggleTheme, setShowAuthModal, setShowWishlist, setShowCart, wishlist, cartCount, selectedCategory }) => (
  <header style={{ backgroundColor: colors.bgSurface }}>
    <div>
      <button onClick={() => setShowMenu(true)}><Menu /></button>
      <input
        type="text"
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        placeholder="Buscar productos..."
      />
      <button onClick={toggleTheme}>{theme === 'light' ? <Moon /> : <Sun />}</button>
      <button onClick={() => setShowCart(true)}><ShoppingCart /> ({cartCount})</button>
      <button onClick={() => setShowWishlist(true)}><Heart /> ({wishlist.length})</button>
      <button onClick={() => setShowAuthModal(true)}><User /></button>
    </div>
  </header>
);
export default Header;
