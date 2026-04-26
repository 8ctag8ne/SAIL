import React from 'react';
import { Typography, Box } from '@mui/material';
import PageContainer from '../components/layout/PageContainer/PageContainer';

const TermsOfUse: React.FC = () => {
    return (
        <PageContainer>
            <Typography variant="h4" sx={{ mb: 4, mr: 2, fontWeight: 'bold' }}>
                [ Умови користування ]
            </Typography>
            <Box sx={{ color: 'text.secondary', display: 'flex', flexDirection: 'column', gap: 3 }}>

                <Box sx={{ p: 2, border: '1px solid', borderColor: 'error.main', backgroundColor: 'rgba(255, 82, 82, 0.05)' }}>
                    <Typography variant="body1" sx={{ color: 'error.main', fontWeight: 'bold' }}>
                        Важливе застереження: MARS є навчальним прототипом та дипломним проєктом. Відповіді, згенеровані штучним інтелектом (через систему RAG), можуть бути неточними, вирваними з контексту або хибними. Ця система в жодному разі не повинна використовуватися для прийняття реальних тактичних, медичних або оперативно-стратегічних рішень на полі бою.
                    </Typography>
                </Box>

                <Typography variant="body1">
                    Отримуючи доступ до Military Archive & Retrieval System (MARS) та використовуючи її, ви погоджуєтеся дотримуватися наступних умов:
                </Typography>

                <Box>
                    <Typography variant="h6" sx={{ color: 'text.primary', mb: 1, fontWeight: 'bold' }}>
                        1. Авторизоване використання
                    </Typography>
                    <Typography variant="body1">
                        MARS призначений виключно для освітніх, дослідницьких цілей та демонстрації роботи прототипу. Несанкціонований доступ, розповсюдження або використання платформи та її бази даних зі зловмисною метою суворо заборонені.
                    </Typography>
                </Box>

                <Box>
                    <Typography variant="h6" sx={{ color: 'text.primary', mb: 1, fontWeight: 'bold' }}>
                        2. Згенерований ШІ контент
                    </Typography>
                    <Typography variant="body1">
                        Система використовує технологію Retrieval-Augmented Generation (RAG) для надання інформації на основі проіндексованих документів. Ви визнаєте, що відповіді, згенеровані ШІ, є лише допоміжним інструментом і можуть містити помилки або пропуски. Розробник системи не несе відповідальності за наслідки застосування інформації, отриманої від ШІ.
                    </Typography>
                </Box>

                <Box>
                    <Typography variant="h6" sx={{ color: 'text.primary', mb: 1, fontWeight: 'bold' }}>
                        3. Відповідальність за користувацький контент
                    </Typography>
                    <Typography variant="body1">
                        Адміністратор та розробник системи не несуть відповідальності за достовірність, актуальність, законність чи безпеку даних (книг, документів, тегів), які завантажуються або розміщуються в системі іншими користувачами. Вся відповідальність за завантажений контент лежить на користувачі, який його розмістив.
                    </Typography>
                </Box>

                <Box>
                    <Typography variant="h6" sx={{ color: 'text.primary', mb: 1, fontWeight: 'bold' }}>
                        4. Обов'язки користувача
                    </Typography>
                    <Typography variant="body1">
                        Ви несете відповідальність за збереження конфіденційності ваших облікових даних і за всі дії, що відбуваються під вашим акаунтом. Ви погоджуєтеся не завантажувати шкідливий контент, не намагатися порушити роботу сервісу (DDoS-атаки, парсинг) та не завантажувати матеріали, які порушують законодавство України.
                    </Typography>
                </Box>

                <Box>
                    <Typography variant="h6" sx={{ color: 'text.primary', mb: 1, fontWeight: 'bold' }}>
                        5. Зміни умов
                    </Typography>
                    <Typography variant="body1">
                        Ми залишаємо за собою право змінювати або припиняти роботу сервісу, а також оновлювати ці умови в будь-який час без попереднього повідомлення. Подальше використання MARS після змін означає вашу згоду з оновленими умовами.
                    </Typography>
                </Box>
            </Box>
        </PageContainer>
    );
};

export default TermsOfUse;