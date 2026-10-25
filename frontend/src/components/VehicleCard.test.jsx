import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import VehicleCard from './VehicleCard'

const car = {
  id: 3,
  make: 'Tata',
  model: 'Nexon EV',
  category: 'Electric',
  year: 2024,
  price: 1490000,
  quantity: 6,
  description: 'About 465 km claimed range.',
}

describe('VehicleCard', () => {
  it('shows the car name, category and price', () => {
    render(<VehicleCard vehicle={car} onPurchase={() => {}} />)

    expect(screen.getByText('Nexon EV')).toBeInTheDocument()
    expect(screen.getByText('Tata')).toBeInTheDocument()
    expect(screen.getByText(/Electric/)).toBeInTheDocument()
    expect(screen.getByText('₹14,90,000')).toBeInTheDocument()
  })

  it('calls onPurchase with the vehicle when Buy is clicked', async () => {
    const onPurchase = vi.fn()
    render(<VehicleCard vehicle={car} onPurchase={onPurchase} />)

    await userEvent.click(screen.getByRole('button', { name: /buy/i }))

    expect(onPurchase).toHaveBeenCalledWith(car)
  })

  it('disables the purchase button when the car is sold out', () => {
    render(<VehicleCard vehicle={{ ...car, quantity: 0 }} onPurchase={() => {}} />)

    const button = screen.getByRole('button', { name: /sold out/i })
    expect(button).toBeDisabled()
  })

  it('disables the button while a purchase is in progress', () => {
    render(<VehicleCard vehicle={car} onPurchase={() => {}} busy />)
    expect(screen.getByRole('button', { name: /buying/i })).toBeDisabled()
  })

  it('warns when stock is low', () => {
    render(<VehicleCard vehicle={{ ...car, quantity: 1 }} onPurchase={() => {}} />)
    expect(screen.getByText('Only 1 left')).toBeInTheDocument()
  })
})
