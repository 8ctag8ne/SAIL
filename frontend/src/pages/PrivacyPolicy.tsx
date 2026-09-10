import React from 'react';
import { Typography, Box } from '@mui/material';
import PageContainer from '../components/layout/PageContainer/PageContainer';

const PrivacyPolicy: React.FC = () => {
    return (
        <PageContainer>
            <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>
                [ Політика конфіденційності ]
            </Typography>
            <Box sx={{ color: 'text.secondary', display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Typography variant="body1">
                    У MARS (Military Archive & Retrieval System) ми прагнемо захищати вашу конфіденційність та гарантувати безпеку ваших персональних даних.
                </Typography>

                <Box>
                    <Typography variant="h6" sx={{ color: 'text.primary', mb: 1, fontWeight: 'bold' }}>
                        1. Збір інформації
                    </Typography>
                    <Typography variant="body1">
                        Ми збираємо необхідні персональні дані, такі як ваша електронна адреса, номер телефону та пароль, виключно для автентифікації, управління обліковим записом та надання персоналізованих функцій у додатку.
                    </Typography>
                </Box>

                <Box>
                    <Typography variant="h6" sx={{ color: 'text.primary', mb: 1, fontWeight: 'bold' }}>
                        2. Використання даних
                    </Typography>
                    <Typography variant="body1">
                        Ваша інформація використовується для безпечного доступу до системи, збереження ваших індивідуальних налаштувань (наприклад, історії запитів) та покращення загальної функціональності MARS. Ми не продаємо ваші персональні дані третім особам.
                    </Typography>
                </Box>

                <Box>
                    <Typography variant="h6" sx={{ color: 'text.primary', mb: 1, fontWeight: 'bold' }}>
                        3. Безпека даних
                    </Typography>
                    <Typography variant="body1">
                        Ми застосовуємо сучасні протоколи шифрування та безпеки для захисту ваших облікових даних та персональної інформації від несанкціонованого доступу.
                    </Typography>
                </Box>

                <Box>
                    <Typography variant="h6" sx={{ color: 'text.primary', mb: 1, fontWeight: 'bold' }}>
                        4. Авторське право та співпраця
                    </Typography>
                    <Typography variant="body1">
                        MARS поважає інтелектуальну власність. Якщо ви вважаєте, що матеріали, розміщені в системі, порушують ваші авторські права, або якщо ви бажаєте обговорити можливості співпраці, будь ласка, зв'яжіться з адміністратором за адресою: <strong>nazaryagotin@gmail.com</strong>.
                    </Typography>
                </Box>

                <Box>
                    <Typography variant="h6" sx={{ color: 'text.primary', mb: 1, fontWeight: 'bold' }}>
                        5. Права користувачів та контакти
                    </Typography>
                    <Typography variant="body1">
                        Ви маєте право на доступ до своїх персональних даних, їх виправлення або видалення в будь-який час. Для цього, а також з будь-яких інших питань, звертайтеся до адміністратора за адресою: <strong>nazaryagotin@gmail.com</strong>.
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 1 }}>
                        Обробка запитів на видалення або зміну даних займає не більше 7 робочих днів.
                    </Typography>
                </Box>
            </Box>
        </PageContainer>
    );
};

export default PrivacyPolicy;