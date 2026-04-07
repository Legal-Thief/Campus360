export const assignTimeSlots = async (attempts) => {
  const slotSize = 10; // users per slot
  const slotDuration = 10; // minutes

  let baseTime = new Date();

  const updatedAttempts = [];

  for (let i = 0; i < attempts.length; i++) {
    const slotIndex = Math.floor(i / slotSize);

    const slotStart = new Date(
      baseTime.getTime() + slotIndex * slotDuration * 60000
    );

    const slotEnd = new Date(
      slotStart.getTime() + slotDuration * 60000
    );

    updatedAttempts.push({
      id: attempts[i]._id,
      slotStart,
      slotEnd,
    });
  }

  return updatedAttempts;
};