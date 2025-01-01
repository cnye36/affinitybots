import React from 'react'

interface ListProps {
  children: React.ReactNode
  className?: string
}

export const List: React.FC<ListProps> = ({ children, className }) => (
  <ul className={className}>{children}</ul>
)

interface ListItemProps {
  children: React.ReactNode
  className?: string
}

export const ListItem: React.FC<ListItemProps> = ({ children, className }) => (
  <li className={className}>{children}</li>
)